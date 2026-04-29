import { create } from 'zustand';
import { AccountSnapshot, BulkPosition } from '../types';

interface PortfolioStore {
  snapshot: AccountSnapshot | null;
  isConnected: boolean;
  setSnapshot: (s: AccountSnapshot) => void;
  updatePosition: (symbol: string, patch: Partial<BulkPosition>) => void;
  setConnected: (v: boolean) => void;
}

export const usePortfolioStore = create<PortfolioStore>((set) => ({
  snapshot: null,
  isConnected: false,
  setSnapshot: (s) => set({ snapshot: s }),
  updatePosition: (symbol, patch) => set((state) => {
    if (!state.snapshot) return state;
    const positions = state.snapshot.positions.map(p => 
      p.symbol === symbol ? { ...p, ...patch } : p
    );
    return { snapshot: { ...state.snapshot, positions } };
  }),
  setConnected: (v) => set({ isConnected: v }),
}));
