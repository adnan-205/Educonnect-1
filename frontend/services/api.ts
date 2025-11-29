import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Configure axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Optional async token provider (e.g., Clerk getToken via Providers)
type TokenProvider = (() => Promise<string | null>) | null;
let authTokenProvider: TokenProvider = null;
export const setAuthTokenProvider = (provider: TokenProvider) => {
  authTokenProvider = provider;
};

export const reviewsApi = {
  getGigReviews: async (
    gigId: string,
    params?: { page?: number; limit?: number; sort?: string }
  ) => {
    try {
      const response = await api.get(`/gigs/${encodeURIComponent(gigId)}/reviews`, { params });
      return response.data; // { success, data: [...], total, totalPages, ... }
    } catch (error) {
      console.error(`Error fetching reviews for gig ${gigId}:`, error);
      throw error;
    }
  },

  getMyReviewForGig: async (gigId: string) => {
    try {
      const response = await api.get(`/gigs/${encodeURIComponent(gigId)}/reviews/me`);
      return response.data; // { success, data: Review | null }
    } catch (error) {
      console.error(`Error fetching my review for gig ${gigId}:`, error);
      throw error;
    }
  },

  createReview: async (
    gigId: string,
    payload: { rating: number; title?: string; comment?: string }
  ) => {
    try {
      const response = await api.post(`/gigs/${encodeURIComponent(gigId)}/reviews`, payload);
      return response.data; // { success, data }
    } catch (error) {
      console.error(`Error creating review for gig ${gigId}:`, error);
      throw error;
    }
  },
};

export const adminApi = {
  listUsers: async (params?: { page?: number; limit?: number; q?: string; role?: 'student' | 'teacher' | 'admin'; isOnboarded?: 'true' | 'false'; }) => {
    try {
      const response = await api.get('/admin/users', { params });
      return response.data; // { success, data: [...], totalPages, ... }
    } catch (error) {
      console.error('Error listing users (admin):', error);
      throw error;
    }
  },

  getUser: async (id: string) => {
    try {
      const response = await api.get(`/admin/users/${encodeURIComponent(id)}`);
      return response.data; // { success, data }
    } catch (error) {
      console.error('Error fetching admin user:', error);
      throw error;
    }
  },

  listActivities: async (params?: { page?: number; limit?: number; userId?: string; action?: string; targetType?: string; from?: string; to?: string; }) => {
    try {
      const response = await api.get('/admin/activities', { params });
      return response.data; // { success, data: [...], totalPages, ... }
    } catch (error) {
      console.error('Error listing activities (admin):', error);
      throw error;
    }
  },

  getUserActivities: async (userId: string, params?: { page?: number; limit?: number; action?: string; }) => {
    try {
      const response = await api.get(`/admin/users/${encodeURIComponent(userId)}/activities`, { params });
      return response.data; // { success, data: [...], totalPages, ... }
    } catch (error) {
      console.error('Error fetching user activities (admin):', error);
      throw error;
    }
  },

  getClassAnalytics: async (params?: { from?: string; to?: string; teacherId?: string; status?: 'pending' | 'accepted' | 'rejected' | 'completed'; }) => {
    try {
      const response = await api.get('/admin/analytics/classes', { params });
      return response.data; // { success, data: { summary, timeseries, topTeachers, revenue, range } }
    } catch (error) {
      console.error('Error fetching class analytics (admin):', error);
      throw error;
    }
  },
};

export const walletAdminApi = {
  getPending: async () => {
    try {
      const response = await api.get('/wallet/admin/withdrawals/pending');
      return response.data; // { success, data: [...] }
    } catch (error) {
      console.error('Error fetching pending withdrawals:', error);
      throw error;
    }
  },

  approve: async (transactionId: string) => {
    try {
      const response = await api.put(`/wallet/admin/withdrawals/${encodeURIComponent(transactionId)}/approve`);
      return response.data; // { success, data }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      throw error;
    }
  },

  reject: async (transactionId: string, reason: string) => {
    try {
      const response = await api.put(`/wallet/admin/withdrawals/${encodeURIComponent(transactionId)}/reject`, { reason });
      return response.data; // { success, data }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      throw error;
    }
  },

  stats: async () => {
    try {
      const response = await api.get('/wallet/admin/stats');
      return response.data; // { success, data }
    } catch (error) {
      console.error('Error fetching wallet stats:', error);
      throw error;
    }
  },
};

export const walletApi = {
  getSummary: async () => {
    try {
      const response = await api.get('/wallet/balance');
      return response.data; // { success, data: { balance, totalEarned, ... } }
    } catch (error) {
      console.error('Error fetching wallet summary:', error);
      throw error;
    }
  },

  getTransactions: async (params?: { type?: 'CREDIT' | 'WITHDRAWAL'; status?: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'; limit?: number; skip?: number; }) => {
    try {
      const response = await api.get('/wallet/transactions', { params });
      return response.data; // { success, data: [...], pagination: {...} }
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      throw error;
    }
  },

  requestWithdrawal: async (payload: { amount: number; withdrawalMethod: 'BANK_TRANSFER' | 'MOBILE_BANKING' | 'PAYPAL' | 'OTHER'; withdrawalDetails?: Record<string, any>; }) => {
    try {
      const response = await api.post('/wallet/withdraw', payload);
      return response.data; // { success, data: {...} }
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      throw error;
    }
  },
};

export const usersApi = {
  getUser: async (id: string) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  },

  getUserGigs: async (id: string) => {
    try {
      const response = await api.get(`/users/${id}/gigs`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${id} gigs:`, error);
      throw error;
    }
  },

  updateMe: async (payload: any) => {
    try {
      const response = await api.put(`/users/me`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error updating current user:`, error);
      throw error;
    }
  },
};

export const paymentsApi = {
  initPayment: async (gigId: string, bookingId?: string) => {
    try {
      const payload: any = { gigId };
      if (bookingId) payload.bookingId = bookingId;
      const response = await api.post('/payments/init', payload);
      return response.data; // { success, url, tran_id }
    } catch (error) {
      console.error('Error initializing payment:', error);
      throw error;
    }
  },

  getStatus: async (gigId: string) => {
    try {
      const response = await api.get(`/payments/status/${encodeURIComponent(gigId)}`, { timeout: 15000 });
      return response.data; // { success, paid }
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  },

  getBookingStatus: async (bookingId: string) => {
    try {
      const response = await api.get(`/payments/booking-status/${encodeURIComponent(bookingId)}`, { timeout: 15000 });
      return response.data; // { success, paid }
    } catch (error) {
      console.error('Error checking booking payment status:', error);
      throw error;
    }
  },
};

export const uploadsApi = {
  uploadImage: async (file: File, folder?: string) => {
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await api.post(
        `/uploads/image${folder ? `?folder=${encodeURIComponent(folder)}` : ''}`,
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          // Image uploads can still take time on slow networks; give them breathing room
          timeout: 60000,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  uploadVideo: async (file: File, folder?: string) => {
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await api.post(
        `/uploads/video${folder ? `?folder=${encodeURIComponent(folder)}` : ''}`,
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          // Video uploads are larger; extend timeout generously (2 minutes)
          timeout: 120000,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  },
  
  uploadGigThumbnail: async (file: File, gigId: string) => {
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await api.post(
        `/uploads/gig-thumbnail?gigId=${encodeURIComponent(gigId)}`,
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        }
      );
      return response.data; // { success, data: { url, public_id, ... }, gig }
    } catch (error) {
      console.error('Error uploading gig thumbnail:', error);
      throw error;
    }
  },

  deleteGigThumbnail: async (gigId: string) => {
    try {
      const response = await api.delete(`/uploads/gig-thumbnail`, { params: { gigId } });
      return response.data; // { success, message, gig }
    } catch (error) {
      console.error('Error deleting gig thumbnail:', error);
      throw error;
    }
  },
};

// Add token to requests (supports async token provider)
api.interceptors.request.use(
  async (config) => {
    // Skip token for public or auth routes if needed
    if (config.url?.includes('/auth/')) {
      return config;
    }

    let token: string | null = null;

    // Prefer backend-issued token first
    if (typeof window !== 'undefined') {
      try { token = localStorage.getItem('token'); } catch {}
    }

    // If no backend token yet, try to obtain one using stored email (silent preflight)
    if (!token && typeof window !== 'undefined') {
      try {
        const email = localStorage.getItem('userEmail');
        if (email && !(config.url || '').includes('/auth/')) {
          const res = await api.post('/auth/clerk-sync', { email });
          const data: any = res?.data || {};
          const newToken = data?.token as string | undefined;
          const user = data?.user;
          if (user) {
            try { localStorage.setItem('user', JSON.stringify(user)); } catch {}
            if (user.role) {
              try { localStorage.setItem('role', user.role); } catch {}
            }
          }
          if (newToken) {
            try { localStorage.setItem('token', newToken); } catch {}
            token = newToken;
          }
        }
      } catch {
        // ignore; will proceed without token and rely on 401 recovery
      }
    }

    // Fallback to Clerk token provider if backend token still missing
    if (!token && authTokenProvider) {
      try {
        token = await authTokenProvider();
      } catch (e) {
        // ignore provider errors and continue without token
      }
    }

    if (token) {
      if (config.headers) {
        (config.headers as any)["Authorization"] = `Bearer ${token}`;
      } else {
        (config as any).headers = { Authorization: `Bearer ${token}` };
      }
    }

    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      params: (config as any).params,
      headers: config.headers,
    });

    return config;
  },
  (error) => {
    console.error('[API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging and lightweight 401 recovery
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.status} ${response.config.url}`, {
      data: response.data,
      headers: response.headers,
    });
    try {
      const url = response.config?.url || '';
      if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/clerk-sync')) {
        const data: any = response.data || {};
        const user = data?.user;
        const token = data?.token;
        if (user) {
          try { localStorage.setItem('user', JSON.stringify(user)); } catch {}
          if (user.role) {
            try { localStorage.setItem('role', user.role); } catch {}
          }
        }
        if (token) {
          try { localStorage.setItem('token', token); } catch {}
        }
      }
    } catch {}
    return response;
  },
  (error: AxiosError) => {
    const cfg = (error.config || {}) as any;
    // Attempt a one-time re-auth on 401 using stored userEmail (set by Providers)
    const status = error.response?.status;
    if (status === 401 && !cfg._retryAuth) {
      try {
        const email = (typeof window !== 'undefined' && (localStorage.getItem('userEmail') || JSON.parse(localStorage.getItem('user') || '{}')?.email)) || null;
        if (email) {
          cfg._retryAuth = true;
          // Keep name optional
          return api.post('/auth/clerk-sync', { email })
            .then((res) => {
              const data: any = res?.data || {};
              const token = data?.token;
              const user = data?.user;
              if (user) {
                try { localStorage.setItem('user', JSON.stringify(user)); } catch {}
                if (user.role) {
                  try { localStorage.setItem('role', user.role); } catch {}
                }
              }
              if (token) {
                try { localStorage.setItem('token', token) } catch {}
                cfg.headers = cfg.headers || {};
                cfg.headers['Authorization'] = `Bearer ${token}`;
              }
              return api.request(cfg);
            })
        }
      } catch {}
    }

    if (error.response) {
      // The request was made and the server responded with a status code
      try {
        const safeStatus = error.response.status;
        const safeUrl = cfg?.url || 'unknown';
        const safeMethod = cfg?.method || 'get';
        const dataAny = (error.response.data as any) || {};
        const msg = dataAny?.message || error.message || 'Unknown error';
        const errs = Array.isArray(dataAny?.errors) ? `: ${dataAny.errors.join(', ')}` : '';
        console.error(`[API] Response Error ${safeStatus} ${safeMethod?.toUpperCase?.()} ${safeUrl}: ${msg}${errs}`);
      } catch {
        console.error('[API] Response Error (unprintable)');
      }
    } else if (error.request) {
      // The request was made but no response was received
      const info = {
        message: error.message,
        code: (error as any).code,
        url: cfg.url,
        method: cfg.method,
        baseURL: (cfg as any).baseURL || api.defaults.baseURL,
        timeout: (cfg as any).timeout,
      } as const;
      // Log a concise string to avoid collapsed/empty object rendering in some consoles
      try {
        const method = info.method?.toUpperCase?.() || 'UNKNOWN';
        const fullUrl = `${info.baseURL || ''}${info.url || ''}`;
        console.error(`[API] No Response for ${method} ${fullUrl} (code=${info.code ?? 'n/a'}, timeout=${info.timeout ?? 'n/a'}): ${info.message}`);
      } catch (_) {
        console.error('[API] No Response:', info);
      }
      // Notify UI layer to present a retry option
      try {
        if (typeof window !== 'undefined') {
          const detail = { url: info.url, method: info.method } as const
          window.dispatchEvent(new CustomEvent('educonnect:network-error', { detail }))
        }
      } catch {}
    } else {
      // Something happened in setting up the request
      console.error('[API] Request Setup Error:', {
        message: error.message,
        code: (error as any).code,
        url: error.config?.url,
        method: error.config?.method,
      });
    }
    
    return Promise.reject(error);
  }
);

export const gigsApi = {
  getAllGigs: async () => {
    try {
      const response = await api.get('/gigs');
      return response.data;
    } catch (error) {
      console.error('Error fetching gigs:', error);
      throw error;
    }
  },

  getGig: async (id: string) => {
    try {
      const response = await api.get(`/gigs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching gig ${id}:`, error);
      throw error;
    }
  },

  createGig: async (gigData: any) => {
    try {
      const response = await api.post('/gigs', gigData);
      return response.data;
    } catch (error) {
      console.error('Error creating gig:', error);
      throw error;
    }
  },

  updateGig: async (id: string, gigData: any) => {
    try {
      const response = await api.put(`/gigs/${id}`, gigData);
      return response.data;
    } catch (error) {
      console.error(`Error updating gig ${id}:`, error);
      throw error;
    }
  },

  deleteGig: async (id: string) => {
    try {
      const response = await api.delete(`/gigs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting gig ${id}:`, error);
      throw error;
    }
  },
};

export const authApi = {
  register: async (userData: { name: string; email: string; password: string; role: string }) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Error logging in user:', error);
      throw error;
    }
  },

  updateRole: async (email: string, role: string) => {
    try {
      const response = await api.put('/auth/update-my-role', { email, role });
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },
};

export const bookingsApi = {
  createBooking: async (bookingData: any) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  getMyBookings: async () => {
    try {
      const response = await api.get('/bookings');
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  updateBookingStatus: async (id: string, status: string) => {
    try {
      const response = await api.put(`/bookings/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating booking ${id}:`, error);
      throw error;
    }
  },
  
  getByRoom: async (roomId: string) => {
    try {
      const response = await api.get(`/bookings/room/${encodeURIComponent(roomId)}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching booking by room ${roomId}:`, error);
      throw error;
    }
  },
  
  markAttendance: async (bookingId: string) => {
    try {
      const response = await api.post(`/bookings/${encodeURIComponent(bookingId)}/attendance`);
      return response.data;
    } catch (error) {
      console.error(`Error marking attendance for booking ${bookingId}:`, error);
      throw error;
    }
  },
};
