'use client';

import { useState, useEffect } from 'react';

export interface TickerData {
  lastPrice: string;
  markPrice: string;
  oraclePrice: string;
  fundingRate: string;
  openInterest: string;
  quoteVolume: string;
  volume: string;
  priceChangePercent: string;
  regime: number;
}

export function useTicker(symbol: string) {
  const [ticker, setTicker] = useState<TickerData | null>(null);

  useEffect(() => {
    const wsUrl = 'wss://exchange-ws1.bulk.trade';
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
        if (msg.type === 'ticker' && msg.data?.ticker) {
          const t = msg.data.ticker;
          setTicker({
            lastPrice: t.lastPrice?.toString() || '0',
            markPrice: t.markPrice?.toString() || '0',
            oraclePrice: t.oraclePrice?.toString() || '0',
            fundingRate: t.fundingRate?.toString() || '0',
            openInterest: t.openInterest?.toString() || '0',
            quoteVolume: t.quoteVolume?.toString() || '0',
            volume: t.volume?.toString() || '0',
            priceChangePercent: t.priceChangePercent?.toString() || '0',
            regime: t.regime || 0
          });
        }
      } catch (e) {}
    };

    return () => {
      ws.close();
    };
  }, [symbol]);

  return ticker;
}
