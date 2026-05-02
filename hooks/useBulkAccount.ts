'use client';

import { useEffect, useRef } from 'react';
import { usePortfolioStore } from '../store/portfolioStore';
import { AccountSnapshot } from '../types';

export function useBulkAccount(userPubkey: string | undefined) {
  const { setSnapshot, setConnected, updateOrder, updatePosition, updateMargin } = usePortfolioStore();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userPubkey) {
      setConnected(false);
      setSnapshot(null as any);
      return;
    }

    const wsUrl = 'wss://exchange-ws1.bulk.trade';
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
          } else if (msg.data.type === 'positionUpdate') {
            const { type, ...patch } = msg.data;
            updatePosition(msg.data.symbol, patch);
          } else if (msg.data.type === 'marginUpdate') {
            const { type, ...patch } = msg.data;
            updateMargin(patch);
          } else if (msg.data.type === 'feeTierUpdate') {
            // handle fee tier update
          }
        }
      } catch (e) {
        console.error('Account WS Error:', e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [userPubkey, setSnapshot, setConnected]);
}
