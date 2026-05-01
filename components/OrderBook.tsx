'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { usePortfolioStore } from '../store/portfolioStore';

interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

interface OrderBookProps {
  symbol: string;
}

export function OrderBook({ symbol }: OrderBookProps) {
  const [bids, setBids] = useState<OrderBookLevel[]>([]);
  const [asks, setAsks] = useState<OrderBookLevel[]>([]);
  const [lastPrice, setLastPrice] = useState(0);
  const [priceChange, setPriceChange] = useState<'up' | 'down' | null>(null);
  const { setPrice } = usePortfolioStore();

  useEffect(() => {
    const coin = symbol.split('-')[0];
    const ws = new WebSocket('wss://exchange-ws1.bulk.trade');
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        method: "subscribe",
        subscription: { type: "l2Book", coin: coin }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.channel === 'l2Book' && msg.data) {
          const l2Data = msg.data;
          
          const processLevels = (levels: any[]) => {
            let total = 0;
            return levels.map((l: any) => {
              const px = parseFloat(l.px);
              const sz = parseFloat(l.sz);
              total += sz;
              return { price: px, size: sz, total };
            });
          };

          const newBids = processLevels(l2Data.levels[0]);
          const newAsks = processLevels(l2Data.levels[1]).sort((a, b) => b.price - a.price);

          setBids(newBids);
          setAsks(newAsks);

          if (newBids.length > 0 && newAsks.length > 0) {
            const mid = (newBids[0].price + newAsks[newAsks.length - 1].price) / 2;
            setLastPrice(prev => {
              if (prev !== 0) {
                if (mid > prev) setPriceChange('up');
                else if (mid < prev) setPriceChange('down');
              }
              return mid;
            });
            setPrice(symbol, mid);
          }
        }
      } catch (err) {
        console.error('WS Message Error:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WS Error:', err);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [symbol]);

  const maxTotal = Math.max(
    bids.length > 0 ? bids[bids.length - 1].total : 1,
    asks.length > 0 ? asks[0].total : 1
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#1B1A14]">
      {/* Table Header */}
      <div className="flex px-4 py-2 border-b border-[#2A2620] text-[9px] font-mono text-[#544A4C] uppercase tracking-widest bg-[#141310]">
        <span className="w-1/3">Price</span>
        <span className="w-1/3 text-right">Size</span>
        <span className="w-1/3 text-right">Total</span>
      </div>

      <div className="flex-1 flex flex-col justify-between overflow-hidden">
        {/* Asks (Sells) */}
        <div className="flex flex-col-reverse justify-end overflow-hidden">
          {asks.map((ask, i) => (
            <div key={i} className="relative flex px-4 h-5 items-center text-[10px] font-mono group hover:bg-[#FFFEEF]/5 transition-colors">
              <div 
                className="absolute right-0 top-0 bottom-0 bg-[#EF4A3C]/10 transition-all duration-500" 
                style={{ width: `${(ask.total / maxTotal) * 100}%` }} 
              />
              <span className="w-1/3 text-[#EF4A3C] z-10">{ask.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
              <span className="w-1/3 text-right text-[#C6B6BA] z-10">{ask.size.toFixed(3)}</span>
              <span className="w-1/3 text-right text-[#736A6C] z-10">{ask.total.toFixed(3)}</span>
            </div>
          ))}
        </div>

        {/* Spread / Mid Price */}
        <div className="px-4 py-3 border-y border-[#2A2620] bg-[#141310] shrink-0 flex items-center justify-between">
          <div className={`text-sm font-bold font-mono transition-colors duration-300 ${priceChange === 'up' ? 'text-[#00B481]' : 'text-[#EF4A3C]'}`}>
            {lastPrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </div>
          <div className="text-[9px] font-mono text-[#544A4C] uppercase tracking-tighter">
            Spread: <span className="text-[#C6B6BA]">{(asks[asks.length-1]?.price - bids[0]?.price).toFixed(1)}</span>
          </div>
        </div>

        {/* Bids (Buys) */}
        <div className="flex flex-col overflow-hidden">
          {bids.map((bid, i) => (
            <div key={i} className="relative flex px-4 h-5 items-center text-[10px] font-mono group hover:bg-[#FFFEEF]/5 transition-colors">
              <div 
                className="absolute right-0 top-0 bottom-0 bg-[#00B481]/10 transition-all duration-500" 
                style={{ width: `${(bid.total / maxTotal) * 100}%` }} 
              />
              <span className="w-1/3 text-[#00B481] z-10">{bid.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
              <span className="w-1/3 text-right text-[#C6B6BA] z-10">{bid.size.toFixed(3)}</span>
              <span className="w-1/3 text-right text-[#736A6C] z-10">{bid.total.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
