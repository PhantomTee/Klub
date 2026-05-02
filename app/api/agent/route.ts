import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt } = body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Intent is required. Please type your trading goal.' }, { status: 400 });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const heuristKey = process.env.HEURIST_API_KEY;

    if (!openRouterKey && !heuristKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY or HEURIST_API_KEY is not configured' }, { status: 500 });
    }

    const systemInstruction = `
      You are Klub, an AI trading agent for Bulk Trade, a Solana perpetuals exchange.
      Parse the user's trading intent and return ONLY a valid JSON object. No markdown formatting or code blocks.
      
      Available perpetual markets: BTC-USD, ETH-USD, SOL-USD, BNB-USD, AVAX-USD, ARB-USD,
      OP-USD, DOGE-USD, XRP-USD, ADA-USD, LINK-USD, MATIC-USD, DOT-USD, UNI-USD, PYTH-USD.
      
      Order type tags: m=market, l=limit, st=stop-loss, tp=take-profit, rng=range/OCO, trig=trigger-basket, trl=trailing-stop, of=on-fill.
      
      Return ONLY this JSON schema (no prose, no markdown wrappers like \`\`\`json):
      {
        "confidence": "high|medium|low",
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
          "onFill": null,
          "nestedActions": null,
          "notes": ""
        }],
        "risks": ["string"],
        "totalNotionalUSD": 10000
      }
    `;

    const baseURL = openRouterKey 
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://llm-gateway.heurist.xyz/v1/chat/completions'; // Assumed heurist endpoint
      
    const apiKey = openRouterKey || heuristKey;
    const model = openRouterKey ? 'anthropic/claude-3.5-sonnet' : 'meta-llama/llama-3-70b-instruct'; // Default fallback

    const response = await fetch(baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://klub.trade',
        'X-Title': 'Klub'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        temperature: 0.05
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API returned ${response.status}: ${err}`);
    }

    const data = await response.json();
    
    if (data.error) {
      const errMsg = typeof data.error === 'object' ? data.error.message : data.error;
      throw new Error(`API Error: ${errMsg}`);
    }

    const content = data.choices?.[0]?.message?.content || "{}";
    const cleaned = content.replace(/^```json\n?|^```\n?/g, '').replace(/\n?```$/g, '').trim();
    
    return NextResponse.json(JSON.parse(cleaned));
  } catch (error: any) {
    console.error('Agent API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
