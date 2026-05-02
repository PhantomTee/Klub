'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Wallet, Activity, Clock } from 'lucide-react';
import { usePortfolioStore } from '../../store/portfolioStore';

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const { snapshot } = usePortfolioStore();

  if (!connected) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-10">
        <div className="w-20 h-20 bg-bg-panel border border-border rounded-full flex items-center justify-center mb-6">
          <Wallet className="text-text-tertiary" size={40} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-3">Portfolio Tracking</h1>
        <p className="text-text-tertiary max-w-sm mb-8">
          Connect your wallet to see your trading performance, asset allocation, and detailed history.
        </p>
      </div>
    );
  }

  const equity = snapshot?.margin.totalBalance || 0;
  const pnl = snapshot?.margin.unrealizedPnl || 0;
  const pnlPercent = equity > 0 ? (pnl / (equity - pnl)) * 100 : 0;

  return (
    <div className="p-6 md:p-10 space-y-10 bg-bg-base min-h-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Performance Dashboard</h1>
          <p className="text-text-tertiary font-mono text-[10px] uppercase tracking-widest">
            Wallet: {publicKey?.toBase58().slice(0, 12)}...{publicKey?.toBase58().slice(-12)}
          </p>
        </div>
        <div className="flex space-x-4">
          <div className="px-4 py-2 bg-bg-panel border border-border rounded-[2px]">
            <span className="block text-[8px] text-text-tertiary uppercase font-bold tracking-widest mb-1">Total Equity</span>
            <span className="text-2xl font-bold font-mono">${equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="px-4 py-2 bg-bg-panel border border-border rounded-[2px]">
            <span className="block text-[8px] text-text-tertiary uppercase font-bold tracking-widest mb-1">Unrealized PnL</span>
            <span className={`text-2xl font-bold font-mono ${pnl >= 0 ? 'text-success' : 'text-danger'}`}>
              {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-bg-panel border border-border rounded-[2px] p-6 flex flex-col items-center justify-center min-h-[350px]">
          <Activity size={32} className="text-text-tertiary mb-4 opacity-20" />
          <p className="text-text-tertiary text-xs uppercase tracking-widest italic">Performance History coming soon from live account snapshot</p>
        </div>

        {/* Allocation */}
        <div className="bg-bg-panel border border-border rounded-[2px] p-6 flex flex-col">
          <div className="flex items-center space-x-3 mb-8">
            <Clock size={18} className="text-accent" />
            <h2 className="text-xs uppercase font-bold tracking-[0.2em] text-text-secondary">Allocation</h2>
          </div>
          <div className="h-[200px] w-full mb-8 flex items-center justify-center text-text-tertiary italic text-xs">
            {snapshot?.positions.length ? 'Allocation loading...' : 'No active positions'}
          </div>
          <div className="space-y-4">
            {snapshot?.positions.map((pos) => (
              <div key={pos.symbol} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <span className="text-[11px] font-bold tracking-tight">{pos.symbol}</span>
                </div>
                <span className="text-[11px] font-mono text-text-tertiary">
                  ${Math.abs(pos.notional).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Asset List */}
      <section className="bg-bg-panel border border-border rounded-[2px] overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-bg-base/50">
          <h2 className="text-[10px] uppercase font-bold tracking-[0.3em] text-text-tertiary">Active Positions</h2>
        </div>
        <table className="w-full text-left font-mono">
          <thead className="text-[9px] text-text-tertiary uppercase tracking-widest border-b border-border">
            <tr>
              <th className="px-6 py-4 font-medium">Market</th>
              <th className="px-6 py-4 font-medium text-right">Size</th>
              <th className="px-6 py-4 font-medium text-right">Entry</th>
              <th className="px-6 py-4 font-medium text-right">PnL</th>
            </tr>
          </thead>
          <tbody className="text-[11px] divide-y divide-border/30">
            {snapshot?.positions.map((pos) => (
              <tr key={pos.symbol}>
                <td className="px-6 py-5 font-bold">{pos.symbol}</td>
                <td className="px-6 py-5 text-right">{pos.size}</td>
                <td className="px-6 py-5 text-right text-text-tertiary">${pos.price.toLocaleString()}</td>
                <td className={`px-6 py-5 text-right font-bold ${pos.unrealizedPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                  ${pos.unrealizedPnl.toLocaleString()}
                </td>
              </tr>
            ))}
            {(!snapshot?.positions || snapshot.positions.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-text-tertiary italic">No active positions found</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
