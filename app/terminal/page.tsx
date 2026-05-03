'use client';
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { TradingChart } from '../../components/charts/TradingChart';
import { RecentTrades } from '../../components/RecentTrades';
import { TradeTabs } from '../../components/TradeTabs';
import TickerBar from '../../components/terminal/TickerBar';
import AdvancedChart from '../../components/terminal/AdvancedChart';
import OrderBook from '../../components/terminal/OrderBook';
import { fetchMarketStats } from '../../lib/bulk-client';
import { useUIStore } from '../../store/uiStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { Star, Loader2 } from 'lucide-react';

import { useMarketStore } from '../../store/marketStore';

export default function TerminalPage() {
  const [symbol, setSymbol] = useState('BTC-USD');
  const [interval, setChartInterval] = useState('1m');
  const [isBuy, setIsBuy] = useState(true);
  const [orderType, setOrderType] = useState('Market');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [leverage, setLeverage] = useState(10);
  const [executing, setExecuting] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'chart' | 'order' | 'trade'>('chart');
  const [availableMarkets, setAvailableMarkets] = useState<string[]>(['BTC-USD', 'ETH-USD', 'SOL-USD']);

  const { favorites, toggleFavorite } = useUIStore();
  const { snapshot } = usePortfolioStore();
  const wallet = useWallet();
  const { ticker, selectedPrice } = useMarketStore();

  useEffect(() => {
    if (selectedPrice && orderType === 'Limit') {
      setPrice(selectedPrice);
    }
  }, [selectedPrice, orderType]);

  useEffect(() => {
    if (orderType === 'Market' && ticker?.lastPrice) {
      setPrice(parseFloat(ticker.lastPrice).toFixed(2));
    }
  }, [ticker, orderType]);

  useEffect(() => {
    async function loadSymbols() {
      try {
        const { fetchExchangeInfo } = await import('../../lib/bulk-client');
        const res = await fetchExchangeInfo();
        // Adjust for potential wrapping object or array
        const markets = Array.isArray(res) ? res : res.markets || res.universe || [];
        const symbols = markets.map((m: any) => m.name || m.symbol || m.coin).filter(Boolean);
        if (symbols.length > 0) {
          setAvailableMarkets(symbols);
        }
      } catch (e) {
        console.error('Failed to load market symbols', e);
      }
    }
    loadSymbols();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 'b') {
        setIsBuy(true);
      } else if (e.key.toLowerCase() === 's') {
        setIsBuy(false);
      } else if (e.key === 'Escape') {
        setSize('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      
      const orderAction = orderType === 'Limit' 
        ? { l: { c: symbol, b: isBuy, sz: contractSize, px: parseFloat(price), r: false, i: false } }
        : { m: { c: symbol, b: isBuy, sz: contractSize, r: false, i: false } };

      // Direct integration with Bulk Trade Execution API
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: wallet.publicKey.toBase58(),
          actions: [orderAction]
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
    <div className="flex flex-col gap-4 pb-20 md:pb-0 h-[calc(100dvh-64px)] md:h-[calc(100vh-64px)]">
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
      <div className={`flex-1 min-h-0 bg-bg-panel border border-border flex flex-col rounded-[2px] overflow-hidden ${activeMobileTab !== 'chart' ? 'hidden md:flex' : 'flex'}`}>
        <div className="h-[48px] flex items-center px-4 border-b border-border gap-4 shrink-0 bg-bg-base overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-3 shrink-0">
            <select 
              value={symbol} 
              onChange={e => setSymbol(e.target.value)}
              className="bg-transparent text-[11px] font-bold font-mono tracking-[0.2em] outline-none text-text-primary uppercase cursor-pointer"
            >
              {availableMarkets.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button 
              onClick={handleToggleFav}
              className={`p-1 transition-colors ${isFav ? 'text-accent' : 'text-border hover:text-text-tertiary'}`}
            >
              <Star size={14} fill={isFav ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="w-[1px] h-4 bg-border shrink-0 hidden md:block ml-2" />

          {/* Market Stats Bar */}
          <TickerBar symbol={symbol} />
        </div>
        <div className="flex-1 relative bg-black">
          <AdvancedChart symbol={symbol} />
        </div>
      </div>

      {/* Bottom Half: Order Book, Recent Trades and Order Entry */}
      <div className={`flex flex-col md:flex-row gap-4 shrink-0 md:h-[280px] overflow-y-auto md:overflow-hidden ${activeMobileTab === 'chart' ? 'hidden md:flex' : 'flex-1 md:flex-none flex'}`}>
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

          <div className="flex-1 flex flex-col text-[11px] font-mono mt-2 overflow-y-auto no-scrollbar">
            <div className="space-y-6">
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
                 <label className="text-[10px] text-text-tertiary uppercase tracking-[0.2em] block mb-2">Price (USD)</label>
                 <input 
                   type="text" 
                   value={price}
                   onChange={e => setPrice(e.target.value)}
                   placeholder="0.00" 
                   disabled={orderType === 'Market'}
                   className={`w-full bg-bg-base border border-border px-3 py-2 rounded-[0px] text-text-primary outline-none font-mono ${orderType === 'Market' ? 'opacity-50 cursor-not-allowed' : ''}`}
                 />
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
              
              {snapshot?.feeTiers?.[0] && (
                 <div className="flex justify-between items-center text-[9px] text-text-tertiary mb-2 border border-border p-2 bg-black/10">
                   <div className="flex flex-col">
                     <span className="uppercase tracking-widest text-[#544A4C]">Tier {(snapshot.feeTiers[0].tierIndex || 0) + 1} Fees</span>
                     <span>M: {snapshot.feeTiers[0].makerBps}bps / T: {snapshot.feeTiers[0].takerBps}bps</span>
                   </div>
                   <div className="flex flex-col text-right">
                     <span className="uppercase tracking-widest text-[#544A4C]">14d Vol</span>
                     <span className="text-accent">${((snapshot.feeTiers[0].rollingVolume || 0) / 1e6).toFixed(1)}M</span>
                   </div>
                 </div>
              )}
            </div>

            <div className="pt-4 border-t border-border mt-auto shrink-0">
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
