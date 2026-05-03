'use client';
import { useMarketStore } from '../../store/marketStore';
import { useMemo, useEffect } from 'react';

export default function OrderBook({ symbol }: { symbol: string }) {
  const { bids, asks, ticker, wsManager, setSelectedPrice } = useMarketStore();

  useEffect(() => {
    // Subscribe to L2 data for the selected symbol
    const topic = `l2_${symbol}`;
    wsManager.subscribe(topic, { type: 'l2Snapshot', symbol, nlevels: 20 });
    return () => {
      wsManager.unsubscribe(topic);
    };
  }, [symbol, wsManager]);

  // Sort and limit to top 15 levels
  const sortedAsks = useMemo(() => Array.from(asks.entries()).sort((a, b) => a[0] - b[0]).slice(0, 15).reverse(), [asks]);
  const sortedBids = useMemo(() => Array.from(bids.entries()).sort((a, b) => b[0] - a[0]).slice(0, 15), [bids]);

  const maxTotal = useMemo(() => {
    let max = 0;
    let runTotal = 0;
    sortedAsks.forEach(([_, sz]) => { runTotal += sz; max = Math.max(max, runTotal); });
    runTotal = 0;
    sortedBids.forEach(([_, sz]) => { runTotal += sz; max = Math.max(max, runTotal); });
    return max || 1; // Prevent division by zero
  }, [sortedAsks, sortedBids]);

  const renderLevels = (levels: [number, number][], type: 'ask' | 'bid') => {
    let runningTotal = 0;
    const color = type === 'ask' ? '#F0524F' : '#22D3A5';
    // Use matching custom styling 
    const bgClass = type === 'ask' ? 'bg-danger/20' : 'bg-success/20';

    return levels.map(([px, sz]) => {
      runningTotal += sz;
      const depthPercentage = (runningTotal / maxTotal) * 100;
      
      return (
        <div 
          key={px} 
          onClick={() => setSelectedPrice(px.toString())}
          className="relative flex justify-between px-4 py-[2px] font-mono text-[10px] hover:bg-white/5 cursor-pointer"
        >
          <div className={`absolute right-0 top-0 h-full ${bgClass}`} style={{ width: `${depthPercentage}%` }} />
          <span style={{ color }} className="z-10">{px.toFixed(1)}</span>
          <span className="text-text-secondary z-10">{sz.toFixed(4)}</span>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-bg-panel overflow-hidden">
      <div className="flex justify-between px-4 py-2 text-[9px] font-mono text-text-tertiary uppercase tracking-widest border-b border-border bg-bg-base">
        <span>Price (USD)</span>
        <span>Size</span>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col justify-end">
        {renderLevels(sortedAsks, 'ask')}
      </div>

      <div className="py-2 px-4 border-y border-border text-center font-bold text-base font-mono bg-bg-base/50" style={{ color: (ticker?.priceChangePercent || 0) >= 0 ? '#22D3A5' : '#F0524F' }}>
        {ticker?.lastPrice?.toFixed(1) || '---'}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {renderLevels(sortedBids, 'bid')}
      </div>
    </div>
  );
}
