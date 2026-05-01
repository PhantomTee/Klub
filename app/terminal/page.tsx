'use client';
import { useState } from 'react';
import { TradingChart } from '../../components/charts/TradingChart';

export default function TerminalPage() {
  const [symbol, setSymbol] = useState('BTC-USD');
  const [interval, setInterval] = useState('1m');

  return (
    <div className="h-[calc(100vh-128px)] flex flex-col gap-6">
      {/* Top Half: Chart & Tools */}
      <div className="flex-1 min-h-[50%] bg-[#1B1A14] border border-[#2A2620] flex flex-col rounded-[2px] overflow-hidden">
        <div className="h-[44px] flex items-center px-4 border-b border-[#2A2620] space-x-6 shrink-0 bg-[#141310]">
          <select 
            value={symbol} 
            onChange={e => setSymbol(e.target.value)}
            className="bg-transparent text-[11px] font-bold font-mono tracking-[0.2em] outline-none text-[#FFFEEF] uppercase"
          >
            <option value="BTC-USD">BTC-USD</option>
            <option value="ETH-USD">ETH-USD</option>
            <option value="SOL-USD">SOL-USD</option>
          </select>
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
      <div className="h-[35%] flex gap-6 shrink-0">
        {/* Order Book */}
        <div className="flex-1 bg-[#1B1A14] border border-[#2A2620] rounded-[2px] flex flex-col focus-shadow">
          <div className="p-3 border-b border-[#2A2620] text-[10px] text-[#736A6C] font-mono tracking-[0.2em] uppercase bg-[#141310]">Order Book</div>
          <div className="flex-1 flex flex-col justify-center items-center text-[#544A4C] text-[10px] font-mono uppercase tracking-[0.2em]">
            Connection Pending...
          </div>
        </div>
        
        {/* Order Entry */}
        <div className="w-[350px] bg-[#1B1A14] border border-[#2A2620] rounded-[2px] flex flex-col p-6 shadow-2xl">
          <div className="flex gap-1 mb-6">
            <button className="flex-1 py-3 bg-[#00B481] text-[#141310] font-bold text-[11px] uppercase tracking-[0.2em] rounded-[0px]">Buy</button>
            <button className="flex-1 py-3 bg-transparent border border-[#EF4A3C]/30 text-[#EF4A3C] font-bold text-[11px] uppercase tracking-[0.2em] rounded-[0px] hover:bg-[#EF4A3C]/5">Sell</button>
          </div>

          <div className="space-y-6 text-[11px] font-mono mt-2">
            <div>
               <label className="text-[10px] text-[#736A6C] uppercase tracking-[0.2em] block mb-2">Order Type</label>
               <select className="w-full bg-[#141310] border border-[#2A2620] px-3 py-2 rounded-[0px] text-[#FFFEEF] outline-none appearance-none">
                 <option>Market Order</option>
                 <option>Limit Order</option>
                 <option>Stop Market</option>
               </select>
            </div>
            <div>
               <label className="text-[10px] text-[#736A6C] uppercase tracking-[0.2em] block mb-2">Size (USD)</label>
               <input type="text" placeholder="0.00" className="w-full bg-[#141310] border border-[#2A2620] px-3 py-2 rounded-[0px] text-[#FFFEEF] outline-none font-mono" />
            </div>
            <div>
               <div className="flex justify-between text-[10px] text-[#736A6C] uppercase tracking-[0.2em] mb-2">
                 <span>Leverage</span>
                 <span className="text-[#FFB547]">10x</span>
               </div>
               <input type="range" min="1" max="50" defaultValue="10" className="w-full h-1 bg-[#2A2620] rounded-full appearance-none accent-[#FFB547]" />
            </div>
            
            <div className="pt-4 border-t border-[#2A2620]">
              <button className="w-full py-4 bg-[#FFB547] text-[#141310] font-bold text-[11px] uppercase tracking-[0.3em] rounded-[0px] hover:bg-[#D48F2A] transition-all">
                Execute Trade
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
