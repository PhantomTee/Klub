export default function BulkTradesPage() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-8 text-[#FFFEEF]">Bulk Trade Queue</h2>
      <div className="p-6 bg-[#1B1A14] border border-[#2A2620] rounded-[2px] min-h-[400px]">
        <div className="text-[10px] text-[#736A6C] uppercase tracking-[0.2em] mb-6 font-mono border-b border-[#2A2620] pb-2">Pending Execution Queue</div>
        <div className="text-[#736A6C] text-[11px] font-mono text-center py-12 uppercase tracking-[0.2em]">Queue is empty</div>
      </div>
    </div>
  );
}
