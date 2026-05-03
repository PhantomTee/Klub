'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { TradeLeg } from '../../types';

export function SortableTradeRow({ leg, index, onRemove }: { leg: TradeLeg, index: number, onRemove: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: leg.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`flex text-sm font-mono items-center border-b border-[#1A1A2E] p-4 bg-[#0F0F1A] hover:bg-[#16162A] transition-colors ${isDragging ? 'shadow-2xl ring-1 ring-[#7B5CF0]' : ''}`}
    >
      <div className="w-10 text-[#555570] cursor-grab active:cursor-grabbing hover:text-[#EEEEFF]" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </div>
      <div className="w-10 text-[#8888AA]">{index + 1}</div>
      <div className="flex-1 font-bold text-[#EEEEFF]">{leg.symbol}</div>
      <div className="flex-1">
         <span className={`px-2 py-1 rounded-[2px] text-[10px] uppercase tracking-widest ${
           leg.direction === 'buy' ? 'bg-[#22D3A5]/10 text-[#22D3A5] border border-[#22D3A5]/20' 
           : 'bg-[#F0524F]/10 text-[#F0524F] border border-[#F0524F]/20'
         }`}>
           {leg.direction} {leg.tag}
         </span>
      </div>
      <div className="flex-1 text-right text-[#EEEEFF]">${leg.sizeUSD.toLocaleString()}</div>
      <div className="flex-1 text-right text-[#555570] text-xs">
        {leg.px ? `@ ${leg.px}` : 'MKT'}
        {leg.isolated && <span className="ml-2 text-[#E8A035]">ISO</span>}
      </div>
      <div className="flex-1 text-right">
        <span className={`px-2 py-1 rounded-[2px] text-[10px] uppercase tracking-widest ${
           leg.status === 'queued' ? 'bg-[#3A3060] text-[#9988FF]' 
           : leg.status === 'submitted' ? 'bg-[#7B5CF0] text-[#EEEEFF]'
           : leg.status === 'filled' ? 'bg-[#1A3030] text-[#22D3A5]'
           : 'bg-[#16162A] text-[#8888AA]'
         }`}>
           {leg.status}
         </span>
      </div>
      <div className="w-10 text-right">
        <button onClick={onRemove} className="text-[#555570] hover:text-[#F0524F] transition-colors p-1 rounded hover:bg-[#F0524F]/10">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
