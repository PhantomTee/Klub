'use client';
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { TradingChart } from '../../components/charts/TradingChart';
import { OrderBook } from '../../components/OrderBook';
import { RecentTrades } from '../../components/RecentTrades';
import { TradeTabs } from '../../components/TradeTabs';
import { fetchMarketStats } from '../../lib/bulk-client';
import { useUIStore } from '../../store/uiStore';
import { Star, Loader2 } from 'lucide-react';

import { useTicker } from '../../hooks/useTicker';

export default function TerminalPage() {
  const [symbol, setSymbol] = useState('BTC-USD');
  const [interval, setChartInterval] = useState('1m');
  const [isBuy, setIsBuy] = useState(true);
  const [orderType, setOrderType] = useState('Market');
  const [size, setSize] = useState('');
  const [leverage, setLeverage] = useState(10);
  const [executing, setExecuting] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'chart' | 'order' | 'trade'>('chart');

  const { favorites, toggleFavorite } = useUIStore();
  const wallet = useWallet();
  const ticker = useTicker(symbol);

  const handleExecute = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      alert('Please connect your wallet first');
      return;
    }
    if (!size || isNaN(parseFloat(size))) {
      alert('Please enter a valid size');
      return;
    }

    setExecuting(true);
    try {
      const markPrice = ticker ? parseFloat(ticker.markPrice) : 0;
      if (markPrice === 0) throw new Error('Mark price unavailable');
      
      const contractSize = parseFloat(size) / markPrice;

      // Direct integration with Bulk Trade Execution API
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: wallet.publicKey.toBase58(),
          actions: [{
            m: {
              c: symbol,
              b: isBuy,
              sz: contractSize,
              r: false,
              i: false
            }
          }]
        })
      });
      const data = await res.json();
      if (data.status === 'err') throw new Error(data.response);
      alert('Trade executed successfully');
    } catch (err: any) {
      console.error('Execution error:', err);
      alert(`Execution failed: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(symbol);
  };

  const isFav = favorites.includes(symbol);

  return (
    <div className="min-h-[calc(100vh-128px)] md:h-[calc(100vh-128px)] flex flex-col gap-6">
      {/* Quick Select Favorites Bar */}
      <div className="flex items-center space-x-2 shrink-0">
        <span className="text-[9px] font-mono text-[#544A4C] uppercase tracking-[0.2em] mr-4">Favorites:</span>
        <div className="flex space-x-2">
          {favorites.map(fav => (
            <button
              key={fav}
              onClick={() => setSymbol(fav)}
              className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest border transition-all ${
                symbol === fav 
                  ? 'bg-accent border-accent text-bg-base font-bold' 
                  : 'bg-bg-panel border-border text-text-tertiary hover:text-text-primary hover:border-text-secondary'
              }`}
            >
              {fav}
            </button>
          ))}
          {favorites.length === 0 && (
            <span className="text-[10px] font-mono text-[#2A2620] italic">No favorites starred</span>
          )}
        </div>
      </div>

      {/* Top Half: Chart & Tools */}
      <div className={`flex-1 min-h-[400px] md:min-h-[50%] bg-bg-panel border border-border flex flex-col rounded-[2px] overflow-hidden ${activeMobileTab !== 'chart' ? 'hidden md:flex' : 'flex'}`}>
        <div className="h-[44px] flex items-center px-4 border-b border-border space-x-6 shrink-0 bg-bg-base">
          <div className="flex items-center space-x-3">
            <select 
              value={symbol} 
              onChange={e => setSymbol(e.target.value)}
              className="bg-transparent text-[11px] font-bold font-mono tracking-[0.2em] outline-none text-text-primary uppercase cursor-pointer"
            >
              <option value="BTC-USD">BTC-USD</option>
              <option value="ETH-USD">ETH-USD</option>
              <option value="SOL-USD">SOL-USD</option>
            </select>
            <button 
              onClick={handleToggleFav}
              className={`p-1 transition-colors ${isFav ? 'text-accent' : 'text-border hover:text-text-tertiary'}`}
            >
              <Star size={14} fill={isFav ? "currentColor" : "none"} />
            </button>
          </div>
          <div className="w-[1px] h-4 bg-border" />
          <div className="flex space-x-4 text-[10px] font-mono text-text-tertiary uppercase tracking-[0.2em]">
            {['1m', '5m', '15m', '1H', '4H', '1D'].map(inv => (
              <button 
                key={inv} 
                onClick={() => setChartInterval(inv)}
                className={`hover:text-text-primary transition-colors ${interval === inv ? 'text-accent' : ''}`}
              >
                {inv}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 relative bg-black">
          <TradingChart symbol={symbol} interval={interval} />
        </div>
        
        {/* Market Stats Bar */}
        <div className="h-[48px] bg-bg-base border-t border-border flex items-center px-6 overflow-x-auto no-scrollbar gap-8 shrink-0">
          <div className="flex flex-col">
            <span className="text-[9px] text-text-tertiary uppercase tracking-tighter">24h Vol</span>
            <span className="text-[11px] font-mono font-bold text-text-primary">
              ${ticker ? (parseFloat(ticker.dayNtlVlm) / 1e6).toFixed(1) + 'M' : '---'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-text-tertiary uppercase tracking-tighter">Oracle Price</span>
            <span className="text-[11px] font-mono font-bold text-text-primary">
              ${ticker ? parseFloat(ticker.oraclePrice).toLocaleString(undefined, { minimumFractionDigits: 1 }) : '---'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-text-tertiary uppercase tracking-tighter">Funding Rate</span>
            <span className="text-[11px] font-mono font-bold text-accent">
              {ticker ? (parseFloat(ticker.funding) * 100).toFixed(4) + '%' : '---'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-text-tertiary uppercase tracking-tighter">Open Interest</span>
            <span className="text-[11px] font-mono font-bold text-text-primary">
              ${ticker ? (parseFloat(ticker.openInterest) * parseFloat(ticker.markPrice) / 1e6).toFixed(1) + 'M' : '---'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Half: Order Book, Recent Trades and Order Entry */}
      <div className={`flex flex-col md:flex-row gap-6 shrink-0 h-auto md:h-[350px] ${activeMobileTab === 'chart' ? 'hidden md:flex' : 'flex'}`}>
        {/* Order Entry */}
        <div className={`w-full md:w-[320px] bg-bg-panel border border-border rounded-[2px] flex flex-col p-5 shadow-2xl order-1 md:order-3 relative z-30 shrink-0 ${activeMobileTab !== 'order' ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex gap-1 mb-5">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsBuy(true); }}
              className={`flex-1 py-4 font-bold text-[11px] uppercase tracking-[0.2em] rounded-[0px] cursor-pointer transition-all border-none outline-none ${
                isBuy ? 'bg-success text-bg-base' : 'bg-transparent border border-success/30 text-success hover:bg-success/5'
              }`}
            >
              Buy
            </button>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsBuy(false); }}
              className={`flex-1 py-4 font-bold text-[11px] uppercase tracking-[0.2em] rounded-[0px] cursor-pointer transition-all border-none outline-none ${
                !isBuy ? 'bg-danger text-bg-base' : 'bg-transparent border border-danger/30 text-danger hover:bg-danger/5'
              }`}
            >
              Sell
            </button>
          </div>

          <div className="space-y-6 text-[11px] font-mono mt-2">
            <div>
               <label className="text-[10px] text-text-tertiary uppercase tracking-[0.2em] block mb-2">Order Type</label>
               <select 
                 value={orderType}
                 onChange={e => setOrderType(e.target.value)}
                 className="w-full bg-bg-base border border-border px-3 py-2 rounded-[0px] text-text-primary outline-none appearance-none cursor-pointer"
               >
                 <option value="Market">Market</option>
                 <option value="Limit">Limit</option>
                 <option value="Stop Market">Stop Market</option>
               </select>
            </div>
            <div>
               <label className="text-[10px] text-text-tertiary uppercase tracking-[0.2em] block mb-2">Size (USD)</label>
               <input 
                 type="text" 
                 value={size}
                 onChange={e => setSize(e.target.value)}
                 placeholder="0.00" 
                 className="w-full bg-bg-base border border-border px-3 py-2 rounded-[0px] text-text-primary outline-none font-mono" 
               />
            </div>
            <div>
               <div className="flex justify-between text-[10px] text-text-tertiary uppercase tracking-[0.2em] mb-2">
                 <span>Leverage</span>
                 <span className="text-accent font-bold">{leverage}x</span>
               </div>
               <input 
                 type="range" 
                 min="1" 
                 max="50" 
                 step="1"
                 value={leverage}
                 onChange={e => setLeverage(parseInt(e.target.value))}
                 className="w-full h-2 bg-border rounded-full appearance-none accent-accent cursor-pointer" 
               />
            </div>
            
            <div className="pt-4 border-t border-border">
              <button 
                type="button"
                onClick={handleExecute}
                disabled={executing || !wallet.connected}
                className={`w-full py-4 font-bold text-[11px] uppercase tracking-[0.3em] rounded-[0px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                  isBuy 
                    ? 'bg-success text-bg-base hover:bg-success/90' 
                    : 'bg-danger text-bg-base hover:bg-danger/90'
                }`}
              >
                {executing ? <Loader2 className="animate-spin" size={16} /> : `Execute ${isBuy ? 'Buy' : 'Sell'}`}
              </button>
            </div>
          </div>
        </div>

        {/* Order Book */}
        <div className={`flex-1 min-h-[400px] md:min-h-0 bg-bg-panel border border-border rounded-[2px] flex flex-col overflow-hidden order-2 md:order-1 ${activeMobileTab === 'chart' ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b border-border text-[10px] text-text-tertiary font-mono tracking-[0.2em] uppercase bg-bg-base">Order Book</div>
          <OrderBook symbol={symbol} />
        </div>

        {/* Recent Trades (Tape) */}
        <div className={`flex-1 min-h-[400px] md:min-h-0 bg-bg-panel border border-border rounded-[2px] flex flex-col overflow-hidden order-3 md:order-2 ${activeMobileTab === 'chart' ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b border-border text-[10px] text-text-tertiary font-mono tracking-[0.2em] uppercase bg-bg-base">Recent Trades</div>
          <RecentTrades symbol={symbol} />
        </div>
      </div>

      {/* Trade Tabs: Positions & Orders */}
      <div className={`shrink-0 ${activeMobileTab === 'chart' ? 'hidden md:block' : 'block'}`}>
        <TradeTabs />
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-bg-panel border-t border-border flex items-center justify-around px-4 z-50">
        <button 
          onClick={() => setActiveMobileTab('order')}
          className={`flex-1 flex items-center justify-center h-full transition-all ${activeMobileTab === 'order' ? 'text-accent border-t-2 border-accent' : 'text-text-tertiary'}`}
        >
          <div className="text-[10px] uppercase font-bold tracking-[0.2em]">Order</div>
        </button>
        <div className="w-[1px] h-8 bg-border" />
        <button 
          onClick={() => setActiveMobileTab('chart')}
          className={`flex-1 flex items-center justify-center h-full transition-all ${activeMobileTab === 'chart' ? 'text-accent border-t-2 border-accent' : 'text-text-tertiary'}`}
        >
          <div className="text-[10px] uppercase font-bold tracking-[0.2em]">Charts</div>
        </button>
      </div>
    </div>
  );
}
