'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { usePortfolioStore } from '../store/portfolioStore';
import { useUIStore } from '../store/uiStore';
import { fetchL2Book } from '../lib/bulk-client';

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
  const [isConnected, setIsConnected] = useState(false);
  const { setPrice } = usePortfolioStore();
  const { environment } = useUIStore();

  useEffect(() => {
    const coin = symbol.split('-')[0];
    let isMounted = true;

    // Fetch initial state
    fetchL2Book(symbol).then(data => {
      if (!isMounted) return;
      
      const processLevels = (levels: any[]) => {
        let cumulativeSize = 0;
        return (levels || []).map((l: any) => {
          const px = parseFloat(l.px || l.price);
          const sz = parseFloat(l.sz || l.size);
          cumulativeSize += sz;
          return { price: px, size: sz, total: cumulativeSize };
        });
      };

      const initialBids = processLevels(data.bids || data.levels?.[0]);
      const initialAsks = processLevels(data.asks || data.levels?.[1]).sort((a, b) => b.price - a.price);

      setBids(initialBids);
      setAsks(initialAsks);
      
      if (initialBids.length > 0 && initialAsks.length > 0) {
        const mid = (initialBids[0].price + initialAsks[initialAsks.length - 1].price) / 2;
        setLastPrice(mid);
      }
    }).catch(err => console.error('Initial L2 fetch error:', err));

    const wsUrl = environment === 'testnet' ? 'wss://testnet-ws1.bulk.trade' : 'wss://exchange-ws1.bulk.trade';
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      if (isMounted) setIsConnected(true);
      ws.send(JSON.stringify({
        method: "subscribe",
        subscription: [{ type: "l2Snapshot", symbol, nlevels: 20 }]
      }));
    };

    ws.onmessage = (event) => {
      if (!isMounted) return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'l2Snapshot' && msg.data?.book) {
          const l2Data = msg.data.book;
          if (l2Data.symbol !== symbol) return;

          const processLevels = (levels: any[]) => {
            let totalDepth = 0;
            return (levels || []).map((l: any) => {
              const px = parseFloat(l.px);
              const sz = parseFloat(l.sz);
              totalDepth += sz;
              return { price: px, size: sz, total: totalDepth };
            });
          };

          const rawBids = l2Data.levels[0] || [];
          const rawAsks = l2Data.levels[1] || [];

          setBids(processLevels(rawBids));
          setAsks(processLevels(rawAsks).sort((a: any, b: any) => b.price - a.price));

          if (rawBids.length > 0 && rawAsks.length > 0) {
            const mid = (parseFloat(rawBids[0].px) + parseFloat(rawAsks[0].px)) / 2;
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

    ws.onclose = () => {
      if (isMounted) setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error('WS Error:', err);
      if (isMounted) setIsConnected(true); // Retry or just show error
    };

    return () => {
      isMounted = false;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [symbol, setPrice, environment]);

  const maxTotal = Math.max(
    bids.length > 0 ? bids[bids.length - 1].total : 1,
    asks.length > 0 ? asks[0].total : 1
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg-panel">
      {/* Table Header */}
      <div className="flex px-4 py-2 border-b border-border text-[9px] font-mono text-text-tertiary uppercase tracking-widest bg-bg-base">
        <span className="w-1/3">Price</span>
        <span className="w-1/3 text-right">Size</span>
        <span className="w-1/3 text-right">Total</span>
      </div>

      <div className="flex-1 flex flex-col justify-between overflow-hidden">
        {/* Asks (Sells) */}
        <div className="flex flex-col-reverse justify-end overflow-hidden">
          {asks.map((ask, i) => (
            <div key={i} className="relative flex px-4 h-5 items-center text-[10px] font-mono group hover:bg-white/5 transition-colors cursor-pointer">
              <div 
                className="absolute right-0 top-[1px] bottom-[1px] bg-danger/20 transition-all duration-300" 
                style={{ width: `${(ask.total / maxTotal) * 100}%` }} 
              />
              <span className="w-1/3 text-danger font-medium z-10">{ask.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
              <span className="w-1/3 text-right text-text-secondary z-10">{ask.size.toFixed(3)}</span>
              <span className="w-1/3 text-right text-text-tertiary z-10">{(ask.total / 1000).toFixed(1)}k</span>
            </div>
          ))}
        </div>

        {/* Spread / Mid Price */}
        <div className="px-4 py-2 border-y border-border bg-bg-base/50 shrink-0 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`text-base font-bold font-mono transition-colors duration-300 ${priceChange === 'up' ? 'text-success' : 'text-danger'}`}>
              {lastPrice > 0 ? lastPrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '---'}
            </div>
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-danger'}`} />
          </div>
          <div className="text-[10px] font-mono text-text-tertiary">
            ${asks.length > 0 && bids.length > 0 ? (asks[asks.length-1].price - bids[0].price).toFixed(1) : '---'}
          </div>
        </div>

        {/* Bids (Buys) */}
        <div className="flex flex-col overflow-hidden">
          {bids.map((bid, i) => (
            <div key={i} className="relative flex px-4 h-5 items-center text-[10px] font-mono group hover:bg-white/5 transition-colors cursor-pointer">
              <div 
                className="absolute right-0 top-[1px] bottom-[1px] bg-success/20 transition-all duration-300" 
                style={{ width: `${(bid.total / maxTotal) * 100}%` }} 
              />
              <span className="w-1/3 text-success font-medium z-10">{bid.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
              <span className="w-1/3 text-right text-text-secondary z-10">{bid.size.toFixed(3)}</span>
              <span className="w-1/3 text-right text-text-tertiary z-10">{(bid.total / 1000).toFixed(1)}k</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
