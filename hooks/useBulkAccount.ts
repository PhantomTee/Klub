'use client';

import { useEffect, useRef } from 'react';
import { usePortfolioStore } from '../store/portfolioStore';
import { AccountSnapshot } from '../types';

export function useBulkAccount(userPubkey: string | undefined) {
  const { setSnapshot, setConnected } = usePortfolioStore();
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
        if (msg.channel === 'account' && msg.data) {
          setSnapshot(msg.data as AccountSnapshot);
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
