'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { X, Trash2, ArrowUpRight, ArrowDownRight, Loader2, Calculator } from 'lucide-react';

import { usePortfolioStore } from '../store/portfolioStore';

import { useUIStore } from '../store/uiStore';

const LiquidationWarningBar = ({ pos }: { pos: any }) => {
  const totalRange = Math.abs(pos.price - pos.liquidationPrice);
  if (totalRange <= 0) return null;
  const currentDistance = Math.abs(pos.fairPrice - pos.liquidationPrice);
  const dangerPercent = Math.max(0, Math.min(100, (1 - (currentDistance / totalRange)) * 100));

  return (
    <div className="w-full flex flex-col mt-1" title={`Liquidation Warning: ${dangerPercent.toFixed(1)}%`}>
      <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-danger transition-all duration-300" 
          style={{ width: `${dangerPercent}%` }}
        />
      </div>
    </div>
  );
};

const PositionRow = ({ pos, closingPos, handleClosePosition }: any) => {
  const [showCalc, setShowCalc] = useState(false);
  const [targetPrice, setTargetPrice] = useState<string>('');
  
  const targetPriceNum = parseFloat(targetPrice || '0');
  const projectedPnl = targetPriceNum > 0 ? pos.size * (targetPriceNum - pos.price) : 0;
  
  return (
    <>
      <tr className="hover:bg-white/5 transition-colors group">
        <td className="px-6 py-4">
          <div className="flex items-center space-x-2">
             <span className={`${pos.size >= 0 ? 'text-success' : 'text-danger'} font-bold`}>{pos.symbol}</span>
             <span className={`text-[8px] ${pos.size >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'} px-1 py-0.5 rounded-[1px]`}>{pos.leverage}X</span>
          </div>
        </td>
        <td className="px-6 py-4 text-text-primary">{pos.size}</td>
        <td className="px-6 py-4 text-text-secondary">${pos.price.toLocaleString(undefined, { minimumFractionDigits: 1 })}</td>
        <td className="px-6 py-4 text-text-secondary">${pos.fairPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}</td>
        <td className="px-6 py-4 text-danger">
          ${pos.liquidationPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}
          <LiquidationWarningBar pos={pos} />
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className={`flex flex-col`}>
               <div className={`flex items-center ${pos.unrealizedPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                 {pos.unrealizedPnl >= 0 ? <ArrowUpRight size={10} className="mr-1" /> : <ArrowDownRight size={10} className="mr-1" />}
                 <span>${pos.unrealizedPnl.toFixed(2)}</span>
               </div>
               <span className="text-[8px] text-text-tertiary mt-0.5">
                 {pos.price > 0 ? (pos.unrealizedPnl / Math.abs(pos.size * pos.price) * 100 * pos.leverage).toFixed(2) : 0}%
               </span>
            </div>
            <button 
              onClick={() => setShowCalc(!showCalc)}
              className="text-text-tertiary hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
              title="PnL Calculator"
            >
              <Calculator size={12} />
            </button>
          </div>
        </td>
        <td className="px-6 py-4 text-right">
          <button 
            onClick={() => handleClosePosition(pos)}
            disabled={closingPos === pos.symbol}
            className="text-text-tertiary hover:text-danger p-1 transition-colors text-[9px] uppercase tracking-tighter disabled:opacity-50 flex items-center justify-end w-full"
          >
            {closingPos === pos.symbol ? <Loader2 size={12} className="animate-spin" /> : 'CLOSE'}
          </button>
        </td>
      </tr>
      {showCalc && (
        <tr className="bg-black/20 text-[10px]">
          <td colSpan={7} className="px-6 py-2 border-l-2 border-accent">
            <div className="flex items-center gap-4">
              <span className="text-text-tertiary uppercase tracking-wider">PnL Calculator</span>
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">Target Price:</span>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary text-xs">$</span>
                  <input 
                    type="number"
                    min="0"
                    step="0.1"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="pl-5 pr-2 py-1 bg-bg-base border border-border text-text-primary rounded-[2px] w-24 text-xs font-mono focus:border-accent focus:outline-none"
                    placeholder={pos.fairPrice.toFixed(2)}
                  />
                </div>
              </div>
              
              {targetPriceNum > 0 && (
                <div className="flex items-center gap-2 ml-4">
                   <span className="text-text-secondary">Projected PnL:</span>
                   <span className={`font-mono font-medium ${projectedPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                     ${projectedPnl.toFixed(2)}
                   </span>
                   <span className="text-text-tertiary text-[9px] ml-1">
                     ({(projectedPnl / Math.abs(pos.size * pos.price) * 100 * pos.leverage).toFixed(2)}%)
                   </span>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export function TradeTabs() {
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');
  const [closingPos, setClosingPos] = useState<string | null>(null);
  const [cancelingOrder, setCancelingOrder] = useState<string | null>(null);
  
  const wallet = useWallet();
  const { connected } = wallet;
  const { snapshot } = usePortfolioStore();
  const { environment } = useUIStore();

  const handleClosePosition = async (pos: any) => {
    if (!wallet.publicKey) return;
    setClosingPos(pos.symbol);
    const isBuy = pos.size < 0; 
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: wallet.publicKey.toBase58(),
          environment,
          actions: [{
            m: {
              c: pos.symbol,
              b: isBuy,
              sz: Math.abs(pos.size),
              r: true,
              i: false
            }
          }]
        })
      });
      const data = await res.json();
      if (data.status === 'err') throw new Error(data.response);
    } catch (e) {
      console.error(e);
      alert('Failed to close position');
    } finally {
      setClosingPos(null);
    }
  };

  const handleCancelOrder = async (order: any) => {
    if (!wallet.publicKey) return;
    setCancelingOrder(order.orderId);
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: wallet.publicKey.toBase58(),
          environment,
          actions: [{
            cx: {
              c: order.symbol,
              oid: order.orderId
            }
          }]
        })
      });
      const data = await res.json();
      if (data.status === 'err') throw new Error(data.response);
    } catch (e) {
      console.error(e);
      alert('Failed to cancel order');
    } finally {
      setCancelingOrder(null);
    }
  };

  const renderPositions = () => {
    if (!snapshot?.positions || snapshot.positions.length === 0) {
      return (
        <tr className="border-none">
          <td colSpan={7} className="px-6 py-10 text-center text-text-tertiary italic opacity-30 select-none">
            No active positions found
          </td>
        </tr>
      );
    }

    return snapshot.positions.map((pos, i) => (
      <PositionRow key={i} pos={pos} closingPos={closingPos} handleClosePosition={handleClosePosition} />
    ));
  };

  const renderOrders = () => {
    if (!snapshot?.openOrders || snapshot.openOrders.length === 0) {
      return (
        <tr className="border-none">
          <td colSpan={8} className="px-6 py-10 text-center text-text-tertiary italic opacity-30 select-none">
            No open orders found
          </td>
        </tr>
      );
    }

    return snapshot.openOrders.map((order, i) => {
      const isBuy = order.originalSize >= 0;
      const sizeAbs = Math.abs(order.originalSize);
      const filledAbs = Math.abs(order.filledSize);

      return (
        <tr key={i} className="hover:bg-white/5 transition-colors group">
          <td className="px-6 py-4 font-bold">{order.symbol}</td>
          <td className="px-6 py-4 text-text-secondary">{order.orderType}</td>
          <td className={`px-6 py-4 ${isBuy ? 'text-success' : 'text-danger'}`}>{isBuy ? 'BUY' : 'SELL'}</td>
          <td className="px-6 py-4">{sizeAbs}</td>
          <td className="px-6 py-4">${order.price.toLocaleString(undefined, { minimumFractionDigits: 1 })}</td>
          <td className="px-6 py-4">
             <div className="flex flex-col">
                <span>{filledAbs}</span>
                <span className="text-[8px] text-text-tertiary">
                  ({sizeAbs > 0 ? ((filledAbs / sizeAbs) * 100).toFixed(1) : 0}%)
                </span>
             </div>
          </td>
          <td className="px-6 py-4">
            <span className="text-[8px] uppercase px-1.5 py-0.5 rounded-[2px] bg-bg-base border border-border text-text-secondary">
              {order.status || 'unknown'}
            </span>
          </td>
          <td className="px-6 py-4 text-right">
            <button 
              onClick={() => handleCancelOrder(order)}
              disabled={cancelingOrder === order.orderId}
              className="text-text-tertiary hover:text-danger transition-colors flex items-center justify-end w-full"
            >
              {cancelingOrder === order.orderId ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Trash2 size={12} className="mr-1" />}
              <span className="text-[9px] uppercase tracking-tighter">Cancel</span>
            </button>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="bg-bg-panel border border-border rounded-[2px] flex flex-col overflow-hidden h-[250px] shrink-0">
      <div className="flex border-b border-border bg-bg-base shrink-0">
        {(['positions', 'orders', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-[10px] uppercase font-bold tracking-[0.2em] transition-all relative ${
              activeTab === tab ? 'text-accent' : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-x-auto no-scrollbar">
        {!connected ? (
          <div className="flex flex-col items-center justify-center h-full text-text-tertiary space-y-2 opacity-50">
            <p className="text-[10px] uppercase tracking-widest">Wallet Disconnected</p>
            <p className="text-[9px]">Connect to view your {activeTab}</p>
          </div>
        ) : (
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-bg-base/30 text-[9px] text-text-tertiary uppercase tracking-widest font-mono">
              {activeTab === 'positions' ? (
                <tr>
                  <th className="px-6 py-3 font-medium">Market</th>
                  <th className="px-6 py-3 font-medium">Size</th>
                  <th className="px-6 py-3 font-medium">Entry Price</th>
                  <th className="px-6 py-3 font-medium">Mark Price</th>
                  <th className="px-6 py-3 font-medium">Liq. Price</th>
                  <th className="px-6 py-3 font-medium">PnL</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              ) : activeTab === 'orders' ? (
                <tr>
                  <th className="px-6 py-3 font-medium">Market</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Side</th>
                  <th className="px-6 py-3 font-medium">Size</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">Filled</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-6 py-3 font-medium">Time</th>
                  <th className="px-6 py-3 font-medium">Market</th>
                  <th className="px-6 py-3 font-medium">Side</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">Size</th>
                  <th className="px-6 py-3 font-medium">Fee</th>
                  <th className="px-6 py-3 font-medium text-right">Status</th>
                </tr>
              )}
            </thead>
            <tbody className="text-[10px] font-mono divide-y divide-border/30">
              {activeTab === 'positions' ? renderPositions() : activeTab === 'orders' ? renderOrders() : (
                <tr className="border-none">
                  <td colSpan={7} className="px-6 py-10 text-center text-text-tertiary italic opacity-30 select-none">
                    No history found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
