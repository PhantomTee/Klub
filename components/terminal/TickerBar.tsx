'use client';
import { useEffect } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { Star } from 'lucide-react';

interface TickerBarProps {
  symbol: string;
  setSymbol: (s: string) => void;
  availableMarkets: string[];
  isFav: boolean;
  onToggleFav: (e: React.MouseEvent) => void;
}

export default function TickerBar({ symbol, setSymbol, availableMarkets, isFav, onToggleFav }: TickerBarProps) {
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

  const isPositive = ticker ? parseFloat(ticker.priceChangePercent) >= 0 : false;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full p-4 bg-bg-base border-b border-border min-h-[96px]">
      <div className="flex flex-col mb-4 sm:mb-0">
        <div className="flex items-center gap-2 mb-1">
          <button 
            onClick={onToggleFav}
            className={`p-1 transition-colors ${isFav ? 'text-accent' : 'text-border hover:text-text-tertiary'}`}
          >
            <Star size={16} fill={isFav ? "currentColor" : "none"} />
          </button>
          <select 
            value={symbol} 
            onChange={e => setSymbol(e.target.value)}
            className="bg-transparent text-[20px] font-bold text-text-primary outline-none cursor-pointer hover:bg-white/5 appearance-none rounded"
          >
            {availableMarkets.map(m => (
              <option key={m} value={m} className="bg-bg-panel text-sm text-text-primary">{m}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 select-none pointer-events-none pr-1 text-text-secondary">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
          <span className="text-[10px] bg-white/5 border border-white/10 px-1 py-0.5 rounded text-text-secondary uppercase ml-1">Perp</span>
        </div>
        {ticker ? (
          <div className="flex items-baseline gap-3">
            <span className={`text-4xl font-mono font-bold tracking-tight ${isPositive ? 'text-[#22D3A5]' : 'text-[#F0524F]'}`}>
              {parseFloat(ticker.lastPrice)?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---'}
            </span>
            <div className={`flex items-center text-[13px] font-mono font-medium ${isPositive ? 'text-[#22D3A5]' : 'text-[#F0524F]'}`}>
              <span>{isPositive ? '+' : ''}{ticker.priceChange || '0.00'}</span>
              <span className="ml-1">{isPositive ? '+' : ''}{parseFloat(ticker.priceChangePercent).toFixed(2) || 0}%</span>
            </div>
          </div>
        ) : (
          <div className="flex items-baseline gap-3 h-10 w-48 animate-pulse bg-white/5 rounded mt-1" />
        )}
      </div>
      
      <div className="flex flex-wrap items-center gap-6 sm:gap-10">
        <div className="flex flex-col min-w-[70px]">
          <span className="text-[10px] text-text-tertiary mb-1">Oracle Price</span>
          <span className="text-[14px] font-mono font-medium text-text-primary">
            {ticker ? (parseFloat(ticker.markPrice)?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---') : '---'}
          </span>
        </div>
        <div className="flex flex-col min-w-[70px]">
          <span className="text-[10px] text-text-tertiary mb-1">24h Volume</span>
          <span className="text-[14px] font-mono font-medium text-text-primary">
            {ticker ? parseFloat(ticker.quoteVolume || ticker.volume || 0).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '---'}
          </span>
        </div>
        <div className="flex flex-col min-w-[70px]">
          <span className="text-[10px] text-text-tertiary mb-1">Open Interest</span>
          <span className="text-[14px] font-mono font-medium text-text-primary">
            {ticker ? (parseFloat(ticker.openInterest)?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '---') : '---'}
          </span>
        </div>
        <div className="flex flex-col min-w-[70px]">
          <span className="text-[10px] text-text-tertiary mb-1">Funding Rate</span>
          <span className="text-[14px] font-mono font-medium text-accent">
            {ticker ? (parseFloat(ticker.fundingRate || '0.0001') * 100).toFixed(4) + '%' : '---'}
          </span>
        </div>
      </div>
    </div>
  );
}
