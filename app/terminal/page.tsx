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
  const [executing, setExecuting] = useState<false | 'buy' | 'sell'>(false);
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

  const handleExecute = async (executeIsBuy: boolean) => {
    if (!wallet.connected || !wallet.publicKey) {
      alert('Please connect your wallet first');
      return;
    }
    if (!size || isNaN(parseFloat(size))) {
      alert('Please enter a valid size');
      return;
    }

    setExecuting(executeIsBuy ? 'buy' : 'sell');
    try {
      const markPrice = ticker ? parseFloat(ticker.markPrice) : 0;
      if (markPrice === 0) throw new Error('Mark price unavailable');
      
      const contractSize = parseFloat(size) / markPrice;
      
      const orderAction = orderType === 'Limit' 
        ? { l: { c: symbol, b: executeIsBuy, sz: contractSize, px: parseFloat(price), r: false, i: false } }
        : { m: { c: symbol, b: executeIsBuy, sz: contractSize, r: false, i: false } };

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
    <div className="flex flex-col h-[calc(100dvh-64px)] md:h-[calc(100vh-64px)] bg-bg-base overflow-hidden">
      
      {/* MOBILE DESKTOP HYBRID LAYOUT */}
      
      {/* MOBILE TOP BAR (Only visible on mobile) */}
      <div className="md:hidden">
        <TickerBar 
          symbol={symbol} 
          setSymbol={setSymbol} 
          availableMarkets={availableMarkets} 
          isFav={isFav} 
          onToggleFav={handleToggleFav} 
        />
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        
        {/* LEFT COLUMN: Ticker (Desktop) + Chart + TradeTabs */}
        <div className={`flex-1 flex col min-w-0 md:border-r border-border md:flex flex-col ${activeMobileTab === 'chart' ? 'flex' : 'hidden md:flex'}`}>
          <div className="hidden md:block">
            <TickerBar 
              symbol={symbol} 
              setSymbol={setSymbol} 
              availableMarkets={availableMarkets} 
              isFav={isFav} 
              onToggleFav={handleToggleFav} 
            />
          </div>
          <div className="flex-1 relative bg-[#131210]">
            <AdvancedChart symbol={symbol} />
          </div>
          <div className="h-[300px] shrink-0 border-t border-border bg-bg-panel overflow-hidden hidden md:block">
            <TradeTabs />
          </div>
        </div>

        {/* MOBILE ORDER VIEW (Orderbook + Form side-by-side) */}
        <div className={`flex-1 flex min-h-0 md:hidden ${activeMobileTab === 'order' ? 'flex' : 'hidden'}`}>
          <div className="w-1/2 flex flex-col border-r border-border relative">
             <div className="absolute top-0 w-full h-full">
               <OrderBook symbol={symbol} />
             </div>
          </div>
          <div className="w-1/2 flex flex-col overflow-y-auto bg-bg-panel">
            {/* Mobile Order Form */}
            <OrderFormContent 
              symbol={symbol} isBuy={isBuy} setIsBuy={setIsBuy} 
              orderType={orderType} setOrderType={setOrderType}
              price={price} setPrice={setPrice} size={size} setSize={setSize}
              leverage={leverage} setLeverage={setLeverage} executing={executing}
              wallet={wallet} handleExecute={handleExecute} snapshot={snapshot}
            />
            {/* Mobile Positions */}
            <div className="mt-4 border-t border-border">
              <TradeTabs />
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Order Book / Trades (Desktop Only) */}
        <div className="hidden md:flex w-[320px] lg:w-[350px] flex-col shrink-0 border-r border-border bg-bg-panel">
          <div className="flex h-12 border-b border-border text-[11px] font-bold text-text-tertiary">
            <button className="flex-1 h-full hover:text-text-primary transition-colors flex justify-center items-center relative text-accent">
              Order Book
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            </button>
            <button className="flex-1 h-full hover:text-text-primary transition-colors flex justify-center items-center">
              Trades
            </button>
          </div>
          <div className="flex-1 min-h-0 relative">
             <div className="absolute inset-0">
               <OrderBook symbol={symbol} />
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Order Entry & Account (Desktop Only) */}
        <div className="hidden md:flex w-[320px] flex-col shrink-0 bg-bg-panel overflow-y-auto no-scrollbar">
          <OrderFormContent 
              symbol={symbol} isBuy={isBuy} setIsBuy={setIsBuy} 
              orderType={orderType} setOrderType={setOrderType}
              price={price} setPrice={setPrice} size={size} setSize={setSize}
              leverage={leverage} setLeverage={setLeverage} executing={executing}
              wallet={wallet} handleExecute={handleExecute} snapshot={snapshot}
          />
        </div>

      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden h-[64px] bg-bg-panel border-t border-border flex items-center justify-around px-4 shrink-0">
        <button 
          onClick={() => setActiveMobileTab('order')}
          className={`flex-1 flex flex-col items-center justify-center h-full transition-all ${activeMobileTab === 'order' ? 'text-text-primary' : 'text-text-tertiary'}`}
        >
          <div className={`text-[12px] font-bold tracking-widest px-8 py-2 rounded ${activeMobileTab === 'order' ? 'bg-[#2A2620]' : ''}`}>Order</div>
        </button>
        <button 
          onClick={() => setActiveMobileTab('chart')}
          className={`flex-1 flex flex-col items-center justify-center h-full transition-all ${activeMobileTab === 'chart' ? 'text-text-primary' : 'text-text-tertiary'}`}
        >
          <div className={`text-[12px] font-bold tracking-widest px-8 py-2 rounded ${activeMobileTab === 'chart' ? 'bg-[#2A2620]' : ''}`}>Charts</div>
        </button>
      </div>
    </div>
  );
}

function OrderFormContent({ 
  symbol, isBuy, setIsBuy, orderType, setOrderType, 
  price, setPrice, size, setSize, leverage, setLeverage, 
  executing, wallet, handleExecute, snapshot 
}: any) {
  return (
    <div className="flex flex-col p-4 space-y-4">
      {/* Margin / Leverage Selector */}
      <div className="flex gap-2">
        <button className="flex-1 py-1.5 bg-[#2A2620] text-text-primary font-mono text-[11px] rounded-[2px]">Cross</button>
        <button className="flex-1 py-1.5 bg-[#2A2620] text-text-primary font-mono text-[11px] rounded-[2px]">{leverage}x</button>
        <button className="w-10 py-1.5 bg-[#2A2620] text-text-primary font-mono text-[11px] rounded-[2px] cursor-not-allowed opacity-50">PM</button>
      </div>

      {/* Order Type Tabs */}
      <div className="flex gap-4 text-[12px] font-bold text-text-tertiary border-b border-border pb-2">
        <button onClick={() => setOrderType('Market')} className={`hover:text-text-primary transition-colors ${orderType === 'Market' ? 'text-accent' : ''}`}>Market</button>
        <button onClick={() => setOrderType('Limit')} className={`hover:text-text-primary transition-colors ${orderType === 'Limit' ? 'text-accent' : ''}`}>Limit</button>
        <div className="flex gap-1 items-center hover:text-text-primary cursor-pointer text-text-tertiary ml-auto">
          <span>Pro</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>

      <div className="space-y-4 text-[11px] font-mono mt-2">
        <div>
           <div className="flex justify-between mb-1">
             <label className="text-text-tertiary">Price</label>
             <span className="text-text-tertiary">Available 0.00</span>
           </div>
           <div className="relative">
             <input 
               type="text" 
               value={price}
               onChange={e => setPrice(e.target.value)}
               placeholder="0.00" 
               disabled={orderType === 'Market'}
               className={`w-full bg-transparent border-b border-border py-2 text-text-primary outline-none focus:border-text-secondary transition-colors ${orderType === 'Market' ? 'opacity-50 cursor-not-allowed text-text-tertiary' : ''}`}
             />
           </div>
        </div>

        <div>
           <label className="text-text-tertiary block mb-1">Size</label>
           <div className="relative flex items-center">
             <input 
               type="text" 
               value={size}
               onChange={e => setSize(e.target.value)}
               placeholder="0.00" 
               className="w-full bg-transparent border-b border-border py-2 text-text-primary outline-none focus:border-text-secondary transition-colors" 
             />
             <span className="absolute right-0 text-text-tertiary border-b border-border h-full flex items-center pr-2">USD</span>
           </div>
        </div>

        <div>
           <input 
             type="range" 
             min="1" 
             max="50" 
             step="1"
             value={leverage}
             onChange={e => setLeverage(parseInt(e.target.value))}
             className="w-full h-1 bg-[#2A2620] rounded-full appearance-none outline-none mt-4 mb-2" 
           />
        </div>

        <div className="space-y-2 mt-4 text-[11px] font-sans text-text-secondary">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-accent bg-transparent border-border" />
            <span>Reduce Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-accent bg-transparent border-border" />
            <span>TP/SL</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4">
        <button 
          onClick={() => { setIsBuy(true); handleExecute(true); }}
          disabled={executing !== false || !wallet.connected}
          className={`flex-1 py-3 font-bold text-[12px] rounded-[2px] transition-all disabled:opacity-50 flex items-center justify-center bg-success text-bg-base hover:bg-success/90`}
        >
          {executing === 'buy' ? <Loader2 className="animate-spin mr-2" size={14} /> : `Buy / Long`}
        </button>
        <button 
          onClick={() => { setIsBuy(false); handleExecute(false); }}
          disabled={executing !== false || !wallet.connected}
          className={`flex-1 py-3 font-bold text-[12px] rounded-[2px] transition-all disabled:opacity-50 flex items-center justify-center bg-danger text-bg-base hover:bg-danger/90`}
        >
          {executing === 'sell' ? <Loader2 className="animate-spin mr-2" size={14} /> : `Sell / Short`}
        </button>
      </div>

      {/* Account / Order Summary Info */}
      <div className="mt-8 space-y-2 text-[10px] font-mono text-text-tertiary border-t border-border pt-4">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-border/50">
          <span className="font-sans">Current Position</span>
          <span className="text-text-primary">0.00 {symbol.split('-')[0]}</span>
        </div>
        <div className="flex justify-between">
          <span>Liq. Price</span>
          <span className="text-[#544A4C]">- / -</span>
        </div>
        <div className="flex justify-between">
          <span>Order Value</span>
          <span className="text-text-primary">$0.00</span>
        </div>
        <div className="flex justify-between">
          <span>Margin Required</span>
          <div className="text-text-primary">
            <span className="text-success">$0.00</span> / <span className="text-danger">$0.00</span>
          </div>
        </div>
        <div className="flex justify-between">
          <span>Fees</span>
          <span className="text-[#544A4C]">- / -</span>
        </div>
      </div>

      {/* Account Actions */}
      <div className="mt-8 pt-4 border-t border-border">
        <div className="flex items-center justify-between font-bold text-[12px] mb-4 font-sans text-text-primary">Account</div>
        <div className="flex gap-2">
           <button className="flex-1 py-1.5 border border-border text-text-primary text-[11px] font-mono hover:bg-white/5 rounded-[2px]">Claim USDC</button>
           <button className="flex-1 py-1.5 border border-border text-text-primary text-[11px] font-mono hover:bg-white/5 rounded-[2px]">Transfer</button>
        </div>
        <div className="mt-4 space-y-1.5 text-[10px] font-mono text-text-tertiary">
          <div className="flex justify-between"><span>Portfolio Margin</span><span className="text-text-primary"></span></div>
          <div className="flex justify-between"><span>Total Equity</span><span className="text-text-primary">$0.00</span></div>
          <div className="flex justify-between"><span>Unrealized PnL</span><span className="text-success">$0.00</span></div>
          <div className="flex justify-between"><span>Portfolio MMR</span><span className="text-success">0.00%</span></div>
          <div className="flex justify-between"><span>Maintenance Margin</span><span className="text-text-primary">$0.00</span></div>
          <div className="flex justify-between"><span>Portfolio APY</span><span className="text-text-primary">coming soon</span></div>
        </div>
      </div>
    </div>
  );
}
