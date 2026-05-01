import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  favorites: string[];
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleFavorite: (symbol: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  favorites: ['BTC-USD'],
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleFavorite: (symbol) => set((state) => ({
    favorites: state.favorites.includes(symbol)
      ? state.favorites.filter((f) => f !== symbol)
      : [...state.favorites, symbol],
  })),
}));
