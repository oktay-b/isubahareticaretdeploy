'use client';

import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // Auth
  user: null,
  token: null,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, token });
  },
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({ user: null, token: null, wallets: [], transactions: [] });
  },

  // Wallets
  wallets: [],
  setWallets: (wallets) => set({ wallets }),

  // Rates
  rates: {},
  previousRates: {},
  rateHistory: [],
  setRates: (rates) => {
    const currentRates = get().rates;
    set({ rates, previousRates: currentRates });
  },
  addRateHistory: (data) => {
    const history = get().rateHistory;
    const newHistory = [...history, data].slice(-100);
    set({ rateHistory: newHistory });
  },
  setRateHistory: (history) => set({ rateHistory: history }),

  // Transactions
  transactions: [],
  setTransactions: (transactions) => set({ transactions }),

  // UI
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),

  // Selected for Graph
  selectedAsset: 'USD/TRY',
  setSelectedAsset: (selectedAsset) => set({ selectedAsset }),

  // Balance visibility
  balanceVisible: true,
  toggleBalanceVisible: () => set((state) => ({ balanceVisible: !state.balanceVisible })),

  // Theme
  theme: 'light',
  toggleTheme: () => {
    const current = get().theme;
    const next = current === 'light' ? 'dark' : 'light';
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
    }
    set({ theme: next });
  },
}));
