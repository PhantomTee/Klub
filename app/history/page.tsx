export default function HistoryPage() {
  return (
    <div>
      <h2 className="text-xl font-medium mb-4">Trade History</h2>
      <div className="p-4 bg-[#0F0F1A] border border-[#2A2A42] rounded-md min-h-[400px]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[#555570] font-medium border-b border-[#1A1A2E] text-xs uppercase tracking-widest">
              <th className="py-2">Date</th>
              <th className="py-2">Market</th>
              <th className="py-2">Type</th>
              <th className="py-2">Dir</th>
              <th className="py-2">Size</th>
              <th className="py-2">Fill Px</th>
              <th className="py-2">PnL</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={8} className="py-6 text-[#555570] text-center text-xs">No trade history found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
