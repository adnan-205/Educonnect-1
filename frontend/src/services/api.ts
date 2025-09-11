import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const auth = {
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
};

// Gigs APIs
export const gigs = {
  getAll: async () => {
    const response = await api.get('/gigs');
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await api.get(`/gigs/${id}`);
    return response.data;
  },
  create: async (gigData: any) => {
    const response = await api.post('/gigs', gigData);
    return response.data;
  },
  update: async (id: string, gigData: any) => {
    const response = await api.put(`/gigs/${id}`, gigData);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/gigs/${id}`);
    return response.data;
  },
};

// Bookings APIs
export const bookings = {
  getAll: async () => {
    const response = await api.get('/bookings');
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },
  create: async (bookingData: any) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },
  updateStatus: async (id: string, status: string) => {
    const response = await api.put(`/bookings/${id}`, { status });
    return response.data;
  },
};

export default api;
