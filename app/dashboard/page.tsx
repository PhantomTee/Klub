export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-8 text-[#FFFEEF]">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-[#1B1A14] border border-[#2A2620] rounded-[2px]">
          <div className="text-[10px] text-[#736A6C] uppercase tracking-[0.2em] mb-3 font-mono">Total Margin</div>
          <div className="text-3xl font-mono text-[#FFB547]">$100,000.00</div>
        </div>
        <div className="md:col-span-2 p-6 bg-[#1B1A14] border border-[#2A2620] rounded-[2px] min-h-[300px]">
          <div className="text-[10px] text-[#736A6C] uppercase tracking-[0.2em] mb-6 font-mono border-b border-[#2A2620] pb-2">Open Positions</div>
          <table className="w-full text-left text-[11px] font-mono">
            <thead>
              <tr className="text-[#C6B6BA] font-medium border-b border-[#2A2620]">
                <th className="py-2 px-1">Market</th>
                <th className="py-2">Size</th>
                <th className="py-2">Entry</th>
                <th className="py-2">Mark</th>
                <th className="py-2 text-right">PnL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="py-12 text-[#736A6C] text-center uppercase tracking-[0.2em]">No open positions</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
