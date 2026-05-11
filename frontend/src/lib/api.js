import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
};

export const walletApi = {
  getWallets: async () => {
    const res = await api.get('/portfolio');
    const mapped = [];
    if (res.data && typeof res.data.balance === 'number') {
      mapped.push({ currency: 'TRY', balance: res.data.balance });
    }
    if (res.data && Array.isArray(res.data.holdings)) {
      res.data.holdings.forEach((h) => {
        mapped.push({ currency: h.asset?.symbol || 'UNKNOWN', balance: h.quantity });
      });
    }
    return { ...res, data: mapped };
  },
};

export const tradeApi = {
  buy:  (data) => api.post('/trade/buy',  data),
  sell: (data) => api.post('/trade/sell', data),
  getHistory: (page = 1, limit = 20) => api.get(`/trade/history?page=${page}&limit=${limit}`),
};

export const ratesApi = {
  getRates: () => api.get('/rates'),
  getHistory: () => api.get('/rates/history'),
};

export default api;
