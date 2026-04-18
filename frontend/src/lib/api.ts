import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 responses (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
};

// Wallet API
export const walletApi = {
  getWallets: async () => {
    const res = await api.get('/portfolio');
    const mapped = [];
    if (res.data && typeof res.data.balance === 'number') {
      mapped.push({ currency: 'TRY', balance: res.data.balance });
    }
    if (res.data && Array.isArray(res.data.holdings)) {
      res.data.holdings.forEach((h: any) => {
        mapped.push({ currency: h.asset?.symbol || 'UNKNOWN', balance: h.quantity });
      });
    }
    return { ...res, data: mapped };
  },
};

// Trade API
export const tradeApi = {
  buy: (data: { fromCurrency: string; toCurrency: string; amount: number }) =>
    api.post('/trade/buy', data),
  sell: (data: { fromCurrency: string; toCurrency: string; amount: number }) =>
    api.post('/trade/sell', data),
  getHistory: (page: number = 1, limit: number = 20) =>
    api.get(`/trade/history?page=${page}&limit=${limit}`),
};

// Rates API
export const ratesApi = {
  getRates: () => api.get('/rates'),
  getHistory: () => api.get('/rates/history'),
};

export default api;
