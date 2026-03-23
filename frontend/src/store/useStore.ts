'use client';

import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Wallet {
  id: string;
  currency: string;
  balance: number;
}

interface Transaction {
  id: string;
  type: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  rate: number;
  total: number;
  createdAt: string;
}

interface RateData {
  rates: Record<string, number>;
  timestamp: number;
}

interface AppStore {
  // Auth
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;

  // Wallets
  wallets: Wallet[];
  setWallets: (wallets: Wallet[]) => void;

  // Rates
  rates: Record<string, number>;
  previousRates: Record<string, number>;
  rateHistory: RateData[];
  setRates: (rates: Record<string, number>) => void;
  addRateHistory: (data: RateData) => void;
  setRateHistory: (history: RateData[]) => void;

  // Transactions
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;

  // UI
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<AppStore>((set, get) => ({
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
}));
