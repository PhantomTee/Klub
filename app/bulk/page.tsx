export default function BulkTradesPage() {
  return (
    <div>
      <h2 className="text-xl font-medium mb-4">Bulk Trade Queue</h2>
      <div className="p-4 bg-[#0F0F1A] border border-[#2A2A42] rounded-md min-h-[400px]">
        <div className="text-xs text-[#8888AA] uppercase tracking-widest mb-4 font-mono">Pending Execution Queue</div>
        <div className="text-[#555570] text-sm text-center py-8">Queue is empty</div>
      </div>
    </div>
  );
}
