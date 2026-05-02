'use client';

import { useState, useEffect } from 'react';

interface Trade {
  price: number;
  size: number;
  side: 'buy' | 'sell';
  time: number;
}

export function RecentTrades({ symbol }: { symbol: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const coin = symbol.split('-')[0];

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_BULK_WS || 'wss://exchange-ws1.bulk.trade';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        method: 'subscribe',
        subscription: [{ type: 'trades', symbol }]
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'trades' && msg.data?.trades) {
          const freshTrades = msg.data.trades.map((t: any) => ({
            price: parseFloat(t.px),
            size: parseFloat(t.sz),
            side: t.side ? 'buy' : 'sell',
            time: t.time
          }));
          setTrades(prev => [...freshTrades, ...prev].slice(0, 50));
        }
      } catch (e) {}
    };

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
         ws.send(JSON.stringify({ method: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, [symbol]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg-panel">
      <div className="flex px-4 py-2 border-b border-border text-[9px] font-mono text-text-tertiary uppercase tracking-widest bg-bg-base">
        <span className="w-1/3">Price</span>
        <span className="w-1/3 text-right">Size</span>
        <span className="w-1/3 text-right">Time</span>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {trades.map((trade, i) => (
          <div key={i} className="flex px-4 py-1.5 text-[10px] font-mono hover:bg-white/5 transition-colors">
            <span className={`w-1/3 ${trade.side === 'buy' ? 'text-success' : 'text-danger'}`}>
              {trade.price.toLocaleString(undefined, { minimumFractionDigits: 1 })}
            </span>
            <span className="w-1/3 text-right text-text-secondary">
              {trade.size.toFixed(4)}
            </span>
            <span className="w-1/3 text-right text-text-tertiary">
              {new Date(trade.time).toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
