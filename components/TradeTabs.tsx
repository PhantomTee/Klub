'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { X, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

import { usePortfolioStore } from '../store/portfolioStore';

export function TradeTabs() {
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');
  const { connected } = useWallet();
  const { snapshot } = usePortfolioStore();

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
      <tr key={i} className="hover:bg-white/5 transition-colors group">
        <td className="px-6 py-4">
          <div className="flex items-center space-x-2">
             <span className={`${pos.size >= 0 ? 'text-success' : 'text-danger'} font-bold`}>{pos.symbol}</span>
             <span className={`text-[8px] ${pos.size >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'} px-1 py-0.5 rounded-[1px]`}>{pos.leverage}X</span>
          </div>
        </td>
        <td className="px-6 py-4 text-text-primary">{pos.size}</td>
        <td className="px-6 py-4 text-text-secondary">${pos.price.toLocaleString(undefined, { minimumFractionDigits: 1 })}</td>
        <td className="px-6 py-4 text-text-secondary">${pos.fairPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}</td>
        <td className="px-6 py-4 text-danger">${pos.liquidationPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}</td>
        <td className="px-6 py-4">
          <div className={`flex items-center ${pos.unrealizedPnl >= 0 ? 'text-success' : 'text-danger'}`}>
             {pos.unrealizedPnl >= 0 ? <ArrowUpRight size={10} className="mr-1" /> : <ArrowDownRight size={10} className="mr-1" />}
             <span>${pos.unrealizedPnl.toFixed(2)}</span>
          </div>
        </td>
        <td className="px-6 py-4 text-right">
          <button className="text-text-tertiary hover:text-danger p-1 transition-colors text-[9px] uppercase tracking-tighter">
            CLOSE
          </button>
        </td>
      </tr>
    ));
  };

  const renderOrders = () => {
    if (!snapshot?.openOrders || snapshot.openOrders.length === 0) {
      return (
        <tr className="border-none">
          <td colSpan={7} className="px-6 py-10 text-center text-text-tertiary italic opacity-30 select-none">
            No open orders found
          </td>
        </tr>
      );
    }

    return snapshot.openOrders.map((order, i) => (
      <tr key={i} className="hover:bg-white/5 transition-colors group">
        <td className="px-6 py-4 font-bold">{order.symbol}</td>
        <td className="px-6 py-4 text-text-secondary">{order.type}</td>
        <td className={`px-6 py-4 ${order.isBuy ? 'text-success' : 'text-danger'}`}>{order.isBuy ? 'BUY' : 'SELL'}</td>
        <td className="px-6 py-4">{order.size}</td>
        <td className="px-6 py-4">${order.price.toLocaleString()}</td>
        <td className="px-6 py-4">0.00%</td>
        <td className="px-6 py-4 text-right">
          <button className="text-text-tertiary hover:text-danger transition-colors">
            <X size={14} />
          </button>
        </td>
      </tr>
    ));
  };

  return (
    <div className="flex-1 bg-bg-panel border border-border rounded-[2px] flex flex-col overflow-hidden min-h-[300px]">
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
