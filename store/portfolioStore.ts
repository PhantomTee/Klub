import { create } from 'zustand';
import { AccountSnapshot, BulkPosition } from '../types';

interface PortfolioStore {
  snapshot: AccountSnapshot | null;
  isConnected: boolean;
  prices: Record<string, number>;
  setSnapshot: (s: AccountSnapshot) => void;
  updatePosition: (symbol: string, patch: Partial<BulkPosition>) => void;
  updateMargin: (margin: any) => void;
  updateOrder: (order: any) => void;
  removeOrder: (orderId: string) => void;
  setConnected: (v: boolean) => void;
  setPrice: (symbol: string, price: number) => void;
}

export const usePortfolioStore = create<PortfolioStore>((set) => ({
  snapshot: null,
  isConnected: false,
  prices: {},
  setSnapshot: (s) => set({ snapshot: s }),
  updatePosition: (symbol, patch) => set((state) => {
    if (!state.snapshot) return state;
    const existing = state.snapshot.positions.find(p => p.symbol === symbol);
    if (!existing) {
      const positions = [...state.snapshot.positions, { symbol, ...patch } as BulkPosition];
      return { snapshot: { ...state.snapshot, positions } };
    }
    const positions = state.snapshot.positions.map(p => 
      p.symbol === symbol ? { ...p, ...patch } : p
    ).filter(p => Math.abs(p.size) > 0);
    return { snapshot: { ...state.snapshot, positions } };
  }),
  updateMargin: (marginUpdate) => set((state) => {
    if (!state.snapshot) return state;
    const margin = { ...state.snapshot.margin, ...marginUpdate };
    return { snapshot: { ...state.snapshot, margin } };
  }),
  updateOrder: (update) => set((state) => {
    if (!state.snapshot) return state;
    const openOrders = [...state.snapshot.openOrders];
    const idx = openOrders.findIndex(o => o.orderId === update.oid);
    
    const updatedOrder = {
      orderId: update.oid,
      symbol: update.sym,
      price: update.px,
      size: update.sz,
      originalSize: update.origSz,
      filledSize: update.fillSz,
      status: update.status,
      orderType: update.ot
    };

    if (idx !== -1) {
      openOrders[idx] = updatedOrder;
    } else {
      openOrders.unshift(updatedOrder);
    }
    
    // terminal states
    const isTerminal = [
      'filled', 'partiallyFilled', 'cancelled', 'cancelledRiskLimit', 
      'cancelledSelfCrossing', 'cancelledReduceOnly', 'cancelledIoc', 
      'rejectedCrossing', 'rejectedDuplicate', 'rejectedRiskLimit', 
      'rejectedInvalid', 'siblingCancelled', 'triggerFailed'
    ].includes(update.status);

    if (isTerminal) {
      setTimeout(() => {
        usePortfolioStore.getState().removeOrder(update.oid);
      }, 5000);
    }
    
    return { snapshot: { ...state.snapshot, openOrders } };
  }),
  removeOrder: (orderId) => set((state) => {
    if (!state.snapshot) return state;
    const openOrders = state.snapshot.openOrders.filter(o => o.orderId !== orderId);
    return { snapshot: { ...state.snapshot, openOrders } };
  }),
  setConnected: (v) => set({ isConnected: v }),
  setPrice: (symbol, price) => set((state) => ({
    prices: { ...state.prices, [symbol]: price }
  })),
}));
