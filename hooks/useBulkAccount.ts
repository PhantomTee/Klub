'use client';

import { useEffect, useRef } from 'react';
import { usePortfolioStore } from '../store/portfolioStore';
import { AccountSnapshot } from '../types';

export function useBulkAccount(userPubkey: string | undefined) {
  const { setSnapshot, setConnected, updateOrder } = usePortfolioStore();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userPubkey) {
      setConnected(false);
      setSnapshot(null);
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_BULK_WS || 'wss://exchange-ws1.bulk.trade';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({
        method: 'subscribe',
        subscription: [{ type: 'account', user: userPubkey }]
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'account' && msg.data) {
          if (msg.data.type === 'accountSnapshot') {
            setSnapshot(msg.data as AccountSnapshot);
          } else if (msg.data.type === 'orderUpdate') {
            updateOrder(msg.data);
          }
        }
      } catch (e) {
        console.error('Account WS Error:', e);
      }
    };

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
         ws.send(JSON.stringify({ method: 'ping' }));
      }
    }, 30000);

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, [userPubkey, setSnapshot, setConnected]);
}
