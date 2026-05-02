'use client';
import { useEffect, useState, useRef } from 'react';

export interface BulkCandle {
  t: number; 
  T: number; 
  o: number; 
  h: number; 
  l: number; 
  c: number; 
  v: number; 
  n: number;
}

export function useBulkMarkets(symbol: string, interval: string) {
  const [candles, setCandles] = useState<BulkCandle[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = 'wss://exchange-ws1.bulk.trade';
    const coin = symbol.split('-')[0];
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        method: 'subscribe',
        subscription: [{ type: 'candle', symbol, interval }]
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'candle' && msg.data && msg.data.candles) {
           const batch = msg.data.candles;
           const newCandles = batch.map((c: any) => ({
             t: Number(c.t),
             T: Number(c.T),
             o: parseFloat(c.o),
             h: parseFloat(c.h),
             l: parseFloat(c.l),
             c: parseFloat(c.c),
             v: parseFloat(c.v),
             n: Number(c.n)
           }));
           setCandles(prev => {
             // If this is a historical dump (large batch) or we had no candles, just use it
             if (newCandles.length > 10 || prev.length === 0) {
               return newCandles;
             }
             // Otherwise it's a live update.
             const updated = [...prev];
             const lastUpdated = newCandles[newCandles.length - 1];
             if (updated.length > 0 && updated[updated.length - 1].t === lastUpdated.t) {
               updated[updated.length - 1] = lastUpdated;
             } else {
               updated.push(lastUpdated);
             }
             return updated;
           });
        }
      } catch (e) {
        // console.error('WS Error parsing message', e);
      }
    };

    // Keepalive ping for standard websockets
    return () => {
      ws.close();
    };
  }, [symbol, interval]);

  return { candles };
}
