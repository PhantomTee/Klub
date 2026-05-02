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
    const wsUrl = process.env.NEXT_PUBLIC_BULK_WS || 'wss://exchange-ws1.bulk.trade';
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
        if (msg.channel === 'candle' && msg.data) {
           const data = msg.data;
           if (Array.isArray(data)) {
             // Historical dump
             const history = data.map((c: any) => ({
               t: Number(c.t),
               T: Number(c.T),
               o: parseFloat(c.o),
               h: parseFloat(c.h),
               l: parseFloat(c.l),
               c: parseFloat(c.c),
               v: parseFloat(c.v),
               n: Number(c.n)
             }));
             setCandles(history);
           } else {
             // Single update
             if (data.s === coin && data.i === interval) {
               setCandles([{
                 t: Number(data.t),
                 T: Number(data.T),
                 o: parseFloat(data.o),
                 h: parseFloat(data.h),
                 l: parseFloat(data.l),
                 c: parseFloat(data.c),
                 v: parseFloat(data.v),
                 n: Number(data.n)
               }]);
             }
           }
        }
      } catch (e) {
        // console.error('WS Error parsing message', e);
      }
    };

    // Keepalive ping for standard websockets
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
         ws.send(JSON.stringify({ method: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, [symbol, interval]);

  return { candles };
}
