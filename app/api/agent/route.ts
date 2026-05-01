import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY is not configured' }, { status: 500 });
    }

    const systemInstruction = `
      You are Klub, an AI trading agent for Bulk Trade, a Solana perpetuals exchange.
      Parse the user's trading intent and return ONLY a valid JSON object.
      
      Available perpetual markets: BTC-USD, ETH-USD, SOL-USD, BNB-USD, AVAX-USD, ARB-USD,
      OP-USD, DOGE-USD, XRP-USD, ADA-USD, LINK-USD, MATIC-USD, DOT-USD, UNI-USD, PYTH-USD.
      
      Order types: m=market, l=limit, st=stop-loss, tp=take-profit.
      
      Output format:
      {
        "confidence": "high|medium|low",
        "summary": "Short description of the plan",
        "totalNotionalUSD": 0,
        "legs": [
          {
            "tag": "Order description",
            "symbol": "BTC-USD",
            "direction": "long|short",
            "sizeUSD": 100,
            "px": null,
            "reduceOnly": false
          }
        ]
      }
    `;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': '(Klub.) Alpha',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    return NextResponse.json(JSON.parse(content));
  } catch (error: any) {
    console.error('OpenRouter Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
