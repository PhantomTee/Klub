'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchExchangeInfo, fetchTicker } from '../../lib/bulk-client';

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  isFav?: boolean;
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMarkets() {
      try {
        const info = await fetchExchangeInfo();
        const symbols = info.universe.map((m: any) => m.name);
        
        // In a real app we'd fetch all tickers in one go if API supports
        // For now, let's mock the live updates if we can't batch
        const initialMarkets = symbols.map((s: string) => ({
          symbol: s,
          price: 0,
          change24h: (Math.random() * 4) - 2, // Mocking change for UI
          volume24h: Math.random() * 100000000,
        }));
        
        setMarkets(initialMarkets);
        setLoading(false);
      } catch (e) {
        console.error('Failed to load markets', e);
        setLoading(false);
      }
    }
    loadMarkets();
  }, []);

  const filteredMarkets = markets.filter(m => 
    m.symbol.toLowerCase().includes(search.toLowerCase())
  ).sort((a,b) => b.volume24h - a.volume24h);

  return (
    <div className="flex flex-col h-full bg-bg-base">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold mb-6">Markets</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
          <input 
            type="text"
            placeholder="Search markets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-panel border border-border px-10 py-3 rounded-[2px] text-sm outline-none focus:border-accent transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-bg-base border-b border-border text-[10px] text-text-tertiary uppercase tracking-widest font-mono">
            <tr>
              <th className="px-6 py-4 font-medium">Symbol / Vol</th>
              <th className="px-6 py-4 font-medium text-right">Last Price / 24h Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filteredMarkets.map((market) => (
              <tr key={market.symbol} className="group hover:bg-bg-panel transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-4">
                    <Star size={16} className="text-text-tertiary group-hover:text-accent transition-colors" />
                    <Link href={`/terminal?symbol=${market.symbol}-USD`} className="flex flex-col">
                      <span className="text-sm font-bold tracking-tight">{market.symbol}-USD</span>
                      <span className="text-[10px] text-text-tertiary font-mono">Vol ${(market.volume24h / 1000000).toFixed(2)}M</span>
                    </Link>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col">
                    <span className="text-sm font-mono font-bold">${market.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <span className={`text-[10px] font-mono ${market.change24h >= 0 ? 'text-success' : 'text-danger'}`}>
                      {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
