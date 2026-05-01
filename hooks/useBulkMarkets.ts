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
        if (msg.topic === `candle.${symbol}.${interval}` && msg.data) {
           if (Array.isArray(msg.data.candles)) {
             setCandles(msg.data.candles);
           }
        }
      } catch (e) {
        console.error('WS Error parsing message', e);
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
