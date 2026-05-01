'use client';

import { usePortfolioStore } from '../../store/portfolioStore';

export default function DashboardPage() {
  const { snapshot } = usePortfolioStore();
  const balance = snapshot?.margin?.totalBalance || 0;
  const positions = snapshot?.positions || [];

  return (
    <div>
      <h2 className="text-xl font-bold mb-8 text-[#FFFEEF]">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-[#1B1A14] border border-[#2A2620] rounded-[2px]">
          <div className="text-[10px] text-[#736A6C] uppercase tracking-[0.2em] mb-3 font-mono">Total Margin</div>
          <div className="text-3xl font-mono text-[#FFB547]">
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {snapshot?.margin && (
            <div className="mt-4 flex justify-between text-[10px] font-mono uppercase tracking-widest text-[#736A6C]">
              <span>Avail: ${snapshot.margin.availableBalance.toLocaleString()}</span>
              <span>PnL: {snapshot.margin.unrealizedPnl >= 0 ? '+' : ''}${snapshot.margin.unrealizedPnl.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="md:col-span-2 p-6 bg-[#1B1A14] border border-[#2A2620] rounded-[2px] min-h-[300px]">
          <div className="text-[10px] text-[#736A6C] uppercase tracking-[0.2em] mb-6 font-mono border-b border-[#2A2620] pb-2">Open Positions</div>
          <table className="w-full text-left text-[11px] font-mono">
            <thead>
              <tr className="text-[#C6B6BA] font-medium border-b border-[#2A2620] uppercase tracking-tighter">
                <th className="py-2 px-1">Market</th>
                <th className="py-2">Size</th>
                <th className="py-2">Entry</th>
                <th className="py-2">Mark</th>
                <th className="py-2 text-right">PnL</th>
              </tr>
            </thead>
            <tbody>
              {positions.length > 0 ? (
                positions.map((pos, idx) => (
                  <tr key={idx} className="border-b border-[#2A2620]/30 hover:bg-[#FFFEEF]/5 transition-colors">
                    <td className="py-4 px-1 font-bold text-[#FFFEEF]">{pos.symbol}</td>
                    <td className="py-4 font-bold">
                       <span className={pos.size >= 0 ? 'text-[#00B481]' : 'text-[#EF4A3C]'}>
                         {pos.size >= 0 ? 'LONG' : 'SHORT'} {Math.abs(pos.size).toFixed(3)}
                       </span>
                    </td>
                    <td className="py-4 text-[#C6B6BA]">${pos.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 text-[#C6B6BA]">${pos.fairPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className={`py-4 text-right font-bold ${pos.unrealizedPnl >= 0 ? 'text-[#00B481]' : 'text-[#EF4A3C]'}`}>
                       {pos.unrealizedPnl >= 0 ? '+' : ''}{pos.unrealizedPnl.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-[#736A6C] text-center uppercase tracking-[0.2em]">No open positions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
