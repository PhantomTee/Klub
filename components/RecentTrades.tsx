'use client';

import { useState, useEffect } from 'react';
import { useMarketStore } from '../store/marketStore';

interface Trade {
  price: number;
  size: number;
  side: 'buy' | 'sell';
  time: number;
}

export function RecentTrades({ symbol }: { symbol: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const { wsManager } = useMarketStore();

  useEffect(() => {
    // Clear trades on symbol change
    setTrades([]);
    
    const topic = `trades.${symbol}`;
    wsManager.subscribe(topic, { type: 'trades', symbol });

    const originalOnMessage = wsManager.onMessage;
    wsManager.onMessage = (msg: any) => {
      originalOnMessage(msg);

      if (msg.type === 'trades' && msg.data?.trades) {
        // filter if needed
        const tradesData = Array.isArray(msg.data.trades) ? msg.data.trades : [msg.data.trades];
        const currentSymbol = msg.data.symbol || symbol;
        if (currentSymbol !== symbol) return;

        const freshTrades = tradesData.map((t: any) => ({
          price: parseFloat(t.px),
          size: parseFloat(t.sz),
          side: t.side ? 'buy' : 'sell',
          time: t.time
        }));
        setTrades(prev => [...freshTrades, ...prev].slice(0, 50));
      }
    };

    return () => {
      wsManager.unsubscribe(topic);
      wsManager.onMessage = originalOnMessage;
    };
  }, [symbol, wsManager]);

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
