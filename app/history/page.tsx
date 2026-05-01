export default function HistoryPage() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-8 text-[#FFFEEF]">Trade History</h2>
      <div className="p-6 bg-[#1B1A14] border border-[#2A2620] rounded-[2px] min-h-[400px]">
        <table className="w-full text-left text-[11px] font-mono">
          <thead>
            <tr className="text-[#C6B6BA] font-medium border-b border-[#2A2620] uppercase tracking-[0.2em]">
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
              <td colSpan={8} className="py-12 text-[#736A6C] text-center uppercase tracking-[0.2em]">No trade history found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
