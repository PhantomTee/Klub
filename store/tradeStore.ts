import { create } from 'zustand';
import { TradeLeg } from '../types';

interface TradeStore {
  queue: TradeLeg[];
  executionStatus: 'idle' | 'executing' | 'done';
  agentMode: boolean;
  addLeg: (leg: TradeLeg) => void;
  removeLeg: (id: string) => void;
  updateLeg: (id: string, patch: Partial<TradeLeg>) => void;
  setQueue: (legs: TradeLeg[]) => void;
  clearQueue: () => void;
  setStatus: (s: TradeStore['executionStatus']) => void;
  setAgentMode: (v: boolean) => void;
}

export const useTradeStore = create<TradeStore>((set) => ({
  queue: [],
  executionStatus: 'idle',
  agentMode: false,
  addLeg: (leg) => set((state) => ({ queue: [...state.queue, leg] })),
  removeLeg: (id) => set((state) => ({ queue: state.queue.filter((l) => l.id !== id) })),
  updateLeg: (id, patch) => set((state) => ({
    queue: state.queue.map((l) => l.id === id ? { ...l, ...patch } : l)
  })),
  setQueue: (legs) => set({ queue: legs }),
  clearQueue: () => set({ queue: [] }),
  setStatus: (s) => set({ executionStatus: s }),
  setAgentMode: (v) => set({ agentMode: v }),
}));
