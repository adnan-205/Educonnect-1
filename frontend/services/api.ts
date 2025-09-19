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

export const uploadsApi = {
  uploadImage: async (file: File, folder?: string) => {
    try {
      console.log('Uploading image:', { fileName: file.name, fileSize: file.size, fileType: file.type });
      
      const form = new FormData();
      form.append('file', file);
      
      // Create a custom config for file uploads - let browser set Content-Type with boundary
      const response = await api.post(`/uploads/image${folder ? `?folder=${encodeURIComponent(folder)}` : ''}`, form, {
        headers: {
          'Content-Type': undefined, // Let browser set multipart/form-data with boundary
        },
        timeout: 60000, // 60 seconds timeout for uploads
      });
      
      console.log('Image upload successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error uploading image:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        }
      });
      throw error;
    }
  },

  uploadVideo: async (file: File, folder?: string) => {
    try {
      console.log('Uploading video:', { fileName: file.name, fileSize: file.size, fileType: file.type });
      
      const form = new FormData();
      form.append('file', file);
      
      // Create a custom config for file uploads - let browser set Content-Type with boundary
      const response = await api.post(`/uploads/video${folder ? `?folder=${encodeURIComponent(folder)}` : ''}`, form, {
        headers: {
          'Content-Type': undefined, // Let browser set multipart/form-data with boundary
        },
        timeout: 120000, // 2 minutes timeout for video uploads
      });
      
      console.log('Video upload successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error uploading video:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        }
      });
      throw error;
    }
  },

  uploadGigThumbnail: async (file: File, gigId: string, folder?: string) => {
    try {
      console.log('Uploading gig thumbnail:', { fileName: file.name, fileSize: file.size, fileType: file.type, gigId });
      
      const form = new FormData();
      form.append('file', file);
      
      const queryParams = new URLSearchParams();
      queryParams.append('gigId', gigId);
      if (folder) {
        queryParams.append('folder', folder);
      }
      
      // Create a custom config for file uploads - let browser set Content-Type with boundary
      const response = await api.post(`/uploads/gig-thumbnail?${queryParams.toString()}`, form, {
        headers: {
          'Content-Type': undefined, // Let browser set multipart/form-data with boundary
        },
        timeout: 60000, // 60 seconds timeout for uploads
      });
      
      console.log('Gig thumbnail upload successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error uploading gig thumbnail:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        }
      });
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

    // 1) Clerk or custom token from provider
    if (authTokenProvider) {
      try {
        token = await authTokenProvider();
      } catch (e) {
        // ignore provider errors and fallback to local storage
      }
    }

    // 2) Fallback to localStorage token (legacy)
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('token');
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

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.status} ${response.config.url}`, {
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('[API] Response Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // The request was made but no response was received
      const cfg = error.config || {};
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
      const response = await api.put('/auth/update-role', { email, role });
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

  getMyBookings: async (status?: string) => {
    try {
      const url = status ? `/bookings?status=${status}` : '/bookings';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  getTeacherDashboardStats: async () => {
    try {
      const response = await api.get('/bookings/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher dashboard stats:', error);
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
};
