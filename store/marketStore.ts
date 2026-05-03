import { create } from 'zustand';
import { BulkWebSocket } from '../lib/bulk-ws';

interface OrderBookLevel {
  px: number;
  sz: number;
  n: number;
}

interface MarketState {
  ticker: any | null;
  bids: Map<number, number>;
  asks: Map<number, number>;
  selectedPrice: string;
  wsManager: BulkWebSocket;
  reconnect: () => void;
  setTicker: (ticker: any) => void;
  setSelectedPrice: (price: string) => void;
  processL2Delta: (bookData: any) => void;
}

export const useMarketStore = create<MarketState>((set, get) => {
  const wsManager = new BulkWebSocket((msg) => {
    if (msg.type === 'l2Snapshot' || msg.type === 'l2Book') {
      get().processL2Delta(msg.data.book || msg.data);
    }
  });
  
  // Start the connection immediately if we are on client side
  if (typeof window !== 'undefined') {
    wsManager.connect();
  }

  return {
    ticker: null,
    bids: new Map(),
    asks: new Map(),
    selectedPrice: '',
    wsManager,

    reconnect: () => {
      wsManager.reconnect();
    },

    setTicker: (ticker) => set({ ticker }),
    setSelectedPrice: (price) => set({ selectedPrice: price }),

    processL2Delta: (bookData) => set((state) => {
      if (!bookData || !bookData.levels) return {};
      // bookData.levels[0] = bids, levels[1] = asks
      const newBids = new Map(state.bids);
      const newAsks = new Map(state.asks);

      const updateSide = (levels: OrderBookLevel[], map: Map<number, number>) => {
        levels.forEach(level => {
          if (level.sz === 0) map.delete(level.px); // sz: 0 means remove level
          else map.set(level.px, level.sz);
        });
      };

      if (bookData.levels[0]) updateSide(bookData.levels[0], newBids);
      if (bookData.levels[1]) updateSide(bookData.levels[1], newAsks);

      return { bids: newBids, asks: newAsks };
    })
  };
});
