'use client';

import { useState, useEffect } from 'react';

export interface TickerData {
  lastPrice: string;
  markPrice: string;
  oraclePrice: string;
  funding: string;
  openInterest: string;
  dayNtlVlm: string;
  priceChangePercent: string;
  regime: number;
}

export function useTicker(symbol: string) {
  const [ticker, setTicker] = useState<TickerData | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_BULK_WS || 'wss://exchange-ws1.bulk.trade';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        method: 'subscribe',
        subscription: [{ type: 'ticker', symbol }]
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.channel === 'ticker' && msg.data) {
          setTicker(msg.data);
        }
      } catch (e) {}
    };

    return () => ws.close();
  }, [symbol]);

  return ticker;
}
