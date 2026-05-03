'use client';

import { useState } from 'react';
import { useTradeStore } from '../../store/tradeStore';
import { useUIStore } from '../../store/uiStore';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTradeRow } from '../../components/bulk/SortableTradeRow';
import { Loader2 } from 'lucide-react';

export default function BulkTradesPage() {
  const { queue, executionStatus, agentMode, removeLeg, setAgentMode, setQueue, clearQueue, setStatus } = useTradeStore();
  const wallet = useWallet();
  const [error, setError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = queue.findIndex((item) => item.id === active.id);
      const newIndex = queue.findIndex((item) => item.id === over?.id);
      setQueue(arrayMove(queue, oldIndex, newIndex));
    }
  };

  const handleExecuteAll = async () => {
    if (queue.length === 0) return;
    if (!agentMode && !wallet.publicKey) {
       setError("Connect wallet or enable Agent Mode to execute.");
       return;
    }
    setError("");
    setStatus('executing');

    try {
      const actions = queue.map(leg => {
         // rough translation without full intent parser hook up for now
         const sz = leg.sizeContracts || 0.1; 
         const isBuy = leg.direction === 'buy';
         return { m: { c: leg.symbol, b: isBuy, sz, r: leg.reduceOnly || false, i: leg.isolated || false } };
      });

      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actions,
          account: wallet.publicKey?.toBase58() || 'agent_mock',
          environment: useUIStore.getState().environment
        })
      });

      const result = await res.json();
      if (result.error) throw new Error(result.error);
      
      // Update store on success
      clearQueue();
      setStatus('done');
    } catch (err: any) {
      setError(err.message);
      setStatus('idle');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-[#EEEEFF] flex items-center gap-3">
          Queue 
          <span className="bg-[#2A2A42] text-[#EEEEFF] text-xs px-2 py-0.5 rounded-full font-mono">{queue.length}</span>
        </h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-[#8888AA]">
             <input type="checkbox" checked={agentMode} onChange={e => setAgentMode(e.target.checked)} className="accent-[#7B5CF0]" />
             Agent Mode
          </label>
          <button onClick={() => clearQueue()} className="px-4 py-2 text-sm text-[#8888AA] hover:text-[#EEEEFF] transition-colors border border-transparent hover:border-[#2A2A42] rounded">
            Clear All
          </button>
          <button onClick={() => {}} className="px-4 py-2 text-sm text-[#8888AA] border border-[#2A2A42] hover:bg-[#1E1E32] transition-colors rounded">
            Simulate
          </button>
          <button 
            onClick={handleExecuteAll}
            disabled={queue.length === 0 || executionStatus === 'executing'}
            className="px-6 py-2 bg-[#7B5CF0] text-[#EEEEFF] font-sans font-medium text-sm rounded hover:bg-[#4A3A90] disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {executionStatus === 'executing' ? <Loader2 size={16} className="animate-spin" /> : 'Execute All'}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-[#F0524F]/10 border border-[#F0524F]/30 text-[#F0524F] rounded text-sm">{error}</div>}

      <div className="bg-[#0F0F1A] border border-[#2A2A42] rounded-md min-h-[400px] overflow-hidden">
        <div className="flex text-[11px] text-[#555570] uppercase tracking-widest font-mono border-b border-[#1A1A2E] bg-[#16162A] p-4">
           <div className="w-10"></div>
           <div className="w-10">#</div>
           <div className="flex-1">Market</div>
           <div className="flex-1">Order Type</div>
           <div className="flex-1 text-right">Size USD</div>
           <div className="flex-1 text-right">Settings</div>
           <div className="flex-1 text-right">Status</div>
           <div className="w-10"></div>
        </div>
        
        {queue.length === 0 ? (
          <div className="text-[#555570] text-[11px] font-mono text-center py-20 uppercase tracking-widest">
            Queue is empty
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={queue.map(q => q.id)}
              strategy={verticalListSortingStrategy}
            >
              {queue.map((leg, index) => (
                <SortableTradeRow key={leg.id} leg={leg} index={index} onRemove={() => removeLeg(leg.id)} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
