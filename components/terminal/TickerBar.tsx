'use client';
import { useEffect } from 'react';
import { useMarketStore } from '../../store/marketStore';

export default function TickerBar({ symbol }: { symbol: string }) {
  const ticker = useMarketStore(state => state.ticker);
  const { wsManager, setTicker } = useMarketStore();

  useEffect(() => {
    // Reset ticker on symbol change
    setTicker(null);
    
    // We need to subscribe to ticker
    const coin = symbol.split('-')[0];
    const topic = `ticker_${symbol}`;
    
    wsManager.subscribe(topic, { type: 'ticker', symbol: coin });
    
    const originalOnMessage = wsManager.onMessage;
    wsManager.onMessage = (msg: any) => {
      // Pass thru for L2Book
      originalOnMessage(msg);
      
      // Update our ticker if match
      if (msg.type === 'ticker' || (msg.data && msg.data.lastPrice)) {
        // sometimes ticker msgs are wrapped in 'data'
        const tData = msg.data || msg;
        if (tData.symbol === symbol || tData.symbol === coin) {
           setTicker(tData);
        }
      }
    };
    
    return () => {
      wsManager.unsubscribe(topic);
      wsManager.onMessage = originalOnMessage;
    };
  }, [symbol, wsManager, setTicker]);

  if (!ticker) return <div className="flex items-center space-x-6 shrink-0 ml-2 animate-pulse"><div className="h-4 w-32 bg-white/5 rounded" /></div>;

  const isPositive = parseFloat(ticker.priceChangePercent) >= 0;

  return (
    <div className="flex items-center gap-6 shrink-0 ml-2">
      <div className="flex flex-col">
        <span className="text-[9px] text-text-tertiary uppercase tracking-tighter">Last Price</span>
        <span className={`text-[11px] font-mono font-bold ${isPositive ? 'text-[#22D3A5]' : 'text-[#F0524F]'}`}>
          ${parseFloat(ticker.lastPrice)?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---'}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] text-text-tertiary uppercase tracking-tighter">24h Change</span>
        <span className={`text-[11px] font-mono font-bold ${isPositive ? 'text-[#22D3A5]' : 'text-[#F0524F]'}`}>
          {isPositive ? '+' : ''}{parseFloat(ticker.priceChangePercent).toFixed(2) || 0}%
        </span>
      </div>
      <div className="flex flex-col hidden sm:flex">
        <span className="text-[9px] text-text-tertiary uppercase tracking-tighter">Mark Price</span>
        <span className="text-[11px] font-mono font-bold text-text-primary">
          ${parseFloat(ticker.markPrice)?.toFixed(2) || '---'}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] text-text-tertiary uppercase tracking-tighter">24h Vol</span>
        <span className="text-[11px] font-mono font-bold text-text-primary">
          ${((parseFloat(ticker.quoteVolume || ticker.volume || 0)) / 1e6).toFixed(1)}M
        </span>
      </div>
      <div className="flex flex-col hidden lg:flex">
        <span className="text-[9px] text-text-tertiary uppercase tracking-tighter">Open Interest</span>
        <span className="text-[11px] font-mono font-bold text-text-primary">
          ${(parseFloat(ticker.openInterest) * parseFloat(ticker.markPrice) / 1e6).toFixed(1)}M
        </span>
      </div>
    </div>
  );
}
