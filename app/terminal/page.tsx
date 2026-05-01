'use client';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { TradingChart } from '../../components/charts/TradingChart';
import { OrderBook } from '../../components/OrderBook';
import { useUIStore } from '../../store/uiStore';
import { Star, Loader2 } from 'lucide-react';

export default function TerminalPage() {
  const [symbol, setSymbol] = useState('BTC-USD');
  const [interval, setInterval] = useState('1m');
  const [isBuy, setIsBuy] = useState(true);
  const [orderType, setOrderType] = useState('Market');
  const [size, setSize] = useState('');
  const [leverage, setLeverage] = useState(10);
  const [executing, setExecuting] = useState(false);
  
  const { favorites, toggleFavorite } = useUIStore();
  const wallet = useWallet();

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
      // Direct integration with Bulk Trade Execution API using Agent format
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: wallet.publicKey.toBase58(),
          actions: [{
            m: {
              c: symbol.split('-')[0],
              b: isBuy,
              sz: parseFloat(size),
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
                  ? 'bg-[#FFB547] border-[#FFB547] text-[#141310] font-bold' 
                  : 'bg-[#1B1A14] border-[#2A2620] text-[#736A6C] hover:text-[#FFFEEF] hover:border-[#544A4C]'
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
      <div className="flex-1 min-h-[50%] bg-[#1B1A14] border border-[#2A2620] flex flex-col rounded-[2px] overflow-hidden">
        <div className="h-[44px] flex items-center px-4 border-b border-[#2A2620] space-x-6 shrink-0 bg-[#141310]">
          <div className="flex items-center space-x-3">
            <select 
              value={symbol} 
              onChange={e => setSymbol(e.target.value)}
              className="bg-transparent text-[11px] font-bold font-mono tracking-[0.2em] outline-none text-[#FFFEEF] uppercase cursor-pointer"
            >
              <option value="BTC-USD">BTC-USD</option>
              <option value="ETH-USD">ETH-USD</option>
              <option value="SOL-USD">SOL-USD</option>
            </select>
            <button 
              onClick={handleToggleFav}
              className={`p-1 transition-colors ${isFav ? 'text-[#FFB547]' : 'text-[#2A2620] hover:text-[#736A6C]'}`}
            >
              <Star size={14} fill={isFav ? "currentColor" : "none"} />
            </button>
          </div>
          <div className="w-[1px] h-4 bg-[#2A2620]" />
          <div className="flex space-x-4 text-[10px] font-mono text-[#736A6C] uppercase tracking-[0.2em]">
            {['1m', '5m', '15m', '1H', '4H', '1D'].map(inv => (
              <button 
                key={inv} 
                onClick={() => setInterval(inv)}
                className={`hover:text-[#FFFEEF] transition-colors ${interval === inv ? 'text-[#FFB547]' : ''}`}
              >
                {inv}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 relative bg-black">
          <TradingChart symbol={symbol} interval={interval} />
        </div>
      </div>

      {/* Bottom Half: Order Book and Order Entry */}
      <div className="flex flex-col md:flex-row gap-6 shrink-0 md:h-[40%] md:min-h-[300px]">
        {/* Order Entry (Moved up for mobile) */}
        <div className="w-full md:w-[350px] bg-[#1B1A14] border border-[#2A2620] rounded-[2px] flex flex-col p-6 shadow-2xl order-1 md:order-2">
          <div className="flex gap-1 mb-6">
            <button 
              onClick={() => setIsBuy(true)}
              className={`flex-1 py-3 font-bold text-[11px] uppercase tracking-[0.2em] rounded-[0px] transition-all ${
                isBuy ? 'bg-[#00B481] text-[#141310]' : 'bg-transparent border border-[#00B481]/30 text-[#00B481] hover:bg-[#00B481]/5'
              }`}
            >
              Buy
            </button>
            <button 
              onClick={() => setIsBuy(false)}
              className={`flex-1 py-3 font-bold text-[11px] uppercase tracking-[0.2em] rounded-[0px] transition-all ${
                !isBuy ? 'bg-[#EF4A3C] text-[#141310]' : 'bg-transparent border border-[#EF4A3C]/30 text-[#EF4A3C] hover:bg-[#EF4A3C]/5'
              }`}
            >
              Sell
            </button>
          </div>

          <div className="space-y-6 text-[11px] font-mono mt-2">
            <div>
               <label className="text-[10px] text-[#736A6C] uppercase tracking-[0.2em] block mb-2">Order Type</label>
               <select 
                 value={orderType}
                 onChange={e => setOrderType(e.target.value)}
                 className="w-full bg-[#141310] border border-[#2A2620] px-3 py-2 rounded-[0px] text-[#FFFEEF] outline-none appearance-none cursor-pointer"
               >
                 <option>Market</option>
                 <option>Limit</option>
                 <option>Stop Market</option>
               </select>
            </div>
            <div>
               <label className="text-[10px] text-[#736A6C] uppercase tracking-[0.2em] block mb-2">Size (USD)</label>
               <input 
                 type="text" 
                 value={size}
                 onChange={e => setSize(e.target.value)}
                 placeholder="0.00" 
                 className="w-full bg-[#141310] border border-[#2A2620] px-3 py-2 rounded-[0px] text-[#FFFEEF] outline-none font-mono" 
               />
            </div>
            <div>
               <div className="flex justify-between text-[10px] text-[#736A6C] uppercase tracking-[0.2em] mb-2">
                 <span>Leverage</span>
                 <span className="text-[#FFB547]">{leverage}x</span>
               </div>
               <input 
                 type="range" 
                 min="1" 
                 max="50" 
                 value={leverage}
                 onChange={e => setLeverage(parseInt(e.target.value))}
                 className="w-full h-1 bg-[#2A2620] rounded-full appearance-none accent-[#FFB547] cursor-pointer" 
               />
            </div>
            
            <div className="pt-4 border-t border-[#2A2620]">
              <button 
                onClick={handleExecute}
                disabled={executing || !wallet.connected}
                className="w-full py-4 bg-[#FFB547] text-[#141310] font-bold text-[11px] uppercase tracking-[0.3em] rounded-[0px] hover:bg-[#D48F2A] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {executing ? <Loader2 className="animate-spin" size={16} /> : 'Execute Trade'}
              </button>
            </div>
          </div>
        </div>

        {/* Order Book */}
        <div className="flex-1 min-h-[400px] md:min-h-0 bg-[#1B1A14] border border-[#2A2620] rounded-[2px] flex flex-col focus-shadow overflow-hidden order-2 md:order-1">
          <div className="p-3 border-b border-[#2A2620] text-[10px] text-[#736A6C] font-mono tracking-[0.2em] uppercase bg-[#141310]">Order Book</div>
          <OrderBook symbol={symbol} />
        </div>
      </div>
    </div>
  );
}
