'use client';
import { useState } from 'react';
import { TradingChart } from '../../components/charts/TradingChart';

export default function TerminalPage() {
  const [symbol, setSymbol] = useState('BTC-USD');
  const [interval, setInterval] = useState('1m');

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      {/* Top Half: Chart & Tools */}
      <div className="flex-1 min-h-[50%] bg-[#0F0F1A] border border-[#2A2A42] flex flex-col rounded-md overflow-hidden">
        <div className="h-[40px] flex items-center px-4 border-b border-[#1A1A2E] space-x-4 shrink-0 bg-[#16162A]">
          <select 
            value={symbol} 
            onChange={e => setSymbol(e.target.value)}
            className="bg-transparent text-sm font-medium font-sans outline-none"
          >
            <option value="BTC-USD">BTC-USD</option>
            <option value="ETH-USD">ETH-USD</option>
            <option value="SOL-USD">SOL-USD</option>
          </select>
          <div className="w-[1px] h-4 bg-[#2A2A42]" />
          <div className="flex space-x-2 text-xs font-mono text-[#8888AA]">
            {['1m', '5m', '15m', '1H', '4H', '1D'].map(inv => (
              <button 
                key={inv} 
                onClick={() => setInterval(inv)}
                className={`hover:text-[#EEEEFF] transition-colors ${interval === inv ? 'text-[#7B5CF0]' : ''}`}
              >
                {inv}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 relative">
          <TradingChart symbol={symbol} interval={interval} />
        </div>
      </div>

      {/* Bottom Half: Order Book and Order Entry */}
      <div className="h-[35%] flex gap-4 shrink-0">
        {/* Order Book */}
        <div className="flex-1 bg-[#0F0F1A] border border-[#2A2A42] rounded-md flex flex-col">
          <div className="p-3 border-b border-[#1A1A2E] text-xs text-[#8888AA] font-mono tracking-widest uppercase">Order Book</div>
          <div className="flex-1 flex flex-col justify-center items-center text-[#555570] text-sm">
            Live L2 Depth coming soon
          </div>
        </div>
        
        {/* Order Entry */}
        <div className="w-[350px] bg-[#0F0F1A] border border-[#2A2A42] rounded-md flex flex-col p-4">
          <div className="flex gap-2 mb-4">
            <button className="flex-1 py-1.5 bg-[#22D3A5] text-[#16162A] font-medium text-sm rounded">LONG</button>
            <button className="flex-1 py-1.5 bg-transparent border border-[#F0524F]/30 text-[#F0524F] font-medium text-sm rounded">SHORT</button>
          </div>

          <div className="space-y-4 text-sm mt-2">
            <div>
               <label className="text-xs text-[#8888AA] block mb-1">Order Type</label>
               <select className="w-full bg-[#16162A] border border-[#2A2A42] px-3 py-2 rounded text-[#EEEEFF] outline-none">
                 <option>Market</option>
                 <option>Limit</option>
                 <option>Stop</option>
               </select>
            </div>
            <div>
               <label className="text-xs text-[#8888AA] block mb-1">Size (USD)</label>
               <input type="text" placeholder="1000" className="w-full bg-[#16162A] border border-[#2A2A42] px-3 py-2 rounded text-[#EEEEFF] outline-none font-mono" />
            </div>
            <div>
               <label className="text-xs text-[#8888AA] block mb-1">Leverage (10x)</label>
               <input type="range" min="1" max="50" defaultValue="10" className="w-full accent-[#7B5CF0]" />
            </div>
            
            <div className="pt-2">
              <button className="w-full py-2 bg-[#7B5CF0] text-[#EEEEFF] font-medium text-sm rounded hover:bg-[#4A3A90] transition-colors">
                Execute Market Long
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
