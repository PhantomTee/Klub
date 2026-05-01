export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-xl font-medium mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-[#0F0F1A] border border-[#2A2A42] rounded-md">
          <div className="text-xs text-[#8888AA] uppercase tracking-widest mb-2 font-mono">Total Margin</div>
          <div className="text-2xl font-mono">$100,000.00</div>
        </div>
        <div className="md:col-span-2 p-4 bg-[#0F0F1A] border border-[#2A2A42] rounded-md min-h-[300px]">
          <div className="text-xs text-[#8888AA] uppercase tracking-widest mb-4 font-mono">Open Positions</div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[#555570] font-medium border-b border-[#1A1A2E]">
                <th className="py-2">Market</th>
                <th className="py-2">Size</th>
                <th className="py-2">Entry</th>
                <th className="py-2">Mark</th>
                <th className="py-2">PnL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="py-4 text-[#555570] text-center text-xs">No open positions</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
