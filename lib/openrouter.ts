const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function parseIntentWithAI(intentMessage: string) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY. Please ensure it is set in your environment.");
  }

  const systemPrompt = `
You are Klub, an AI trading agent for Bulk Trade, a Solana perpetuals exchange.
Parse the user's trading intent and return ONLY a valid JSON object. No prose, no markdown.

Available perpetual markets: BTC-USD, ETH-USD, SOL-USD, BNB-USD, AVAX-USD, ARB-USD,
OP-USD, DOGE-USD, XRP-USD, ADA-USD, LINK-USD, MATIC-USD, DOT-USD, UNI-USD, PYTH-USD.

Order types: m=market, l=limit, st=stop-loss, tp=take-profit, rng=range/OCO,
             trig=trigger-basket, trl=trailing-stop.
             Use "of" when user wants stop/TP attached on-fill.

Return this JSON schema ONLY:
{
  "confidence": "high"|"medium"|"low",
  "summary": "one sentence",
  "legs": [{
    "id": "leg_1",
    "tag": "m"|"l"|"st"|"tp"|"rng"|"trig"|"trl",
    "symbol": "BTC-USD",
    "direction": "buy"|"sell",
    "sizeUSD": 10000,
    "sizeContracts": null,
    "px": null,
    "tif": "GTC"|"IOC"|"ALO"|null,
    "reduceOnly": false,
    "isolated": false,
    "triggerPrice": null,
    "limitPrice": null,
    "trailBps": null,
    "stepBps": null,
    "collarMin": null,
    "collarMax": null,
    "delaySeconds": 0,
    "onFill": null | { "stopTrigger": null|number, "tpTrigger": null|number },
    "nestedActions": null,
    "notes": ""
  }],
  "risks": ["string"],
  "totalNotionalUSD": 10000
}

Rules:
- m for market orders, l for limit, st for stop-loss, tp for take-profit.
- rng when user specifies both a stop-loss AND take-profit level at placement time.
- trl when user says "trailing stop".
- trig when a price threshold should trigger multiple subsequent actions.
- isolated: true when user mentions "isolated" or "isolate".
- onFill: set when user asks to attach SL/TP after an entry order fills.
- delaySeconds: set if user wants orders spread over time.
- reduceOnly: true only for orders closing existing positions.
- Estimate sizeUSD from context; leave sizeContracts null (computed at runtime from mark price).
- Low confidence if intent is vague. High confidence if fully specified.
- Return ONLY the JSON. No explanation. No markdown.
`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://klub.trade",
      "X-Title": "Klub",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash", // model accessible through openrouter
      temperature: 0.05,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: intentMessage }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() || "";
  
  try {
    let jsonStr = content;
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/```json\n/g, "").replace(/\n```/g, "");
    }
    return JSON.parse(jsonStr);
  } catch (e) {
    throw new Error("Failed to parse JSON response: " + content);
  }
}
