import axios from 'axios';
import type { AuthResponse, LoginData, RegisterData, User } from './auth-types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  verifyEmail: async (token: string): Promise<void> => {
    await api.get(`/auth/verify-email?token=${token}`);
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
  },

  getGoogleLoginUrl: async (): Promise<string> => {
    const response = await api.get('/auth/google');
    return response.data.url;
  },

  googleCallback: async (code: string): Promise<AuthResponse> => {
    const response = await api.get(`/auth/google/callback?code=${code}`);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/me');
    return response.data;
  },

  setAccessToken(token: string | null) {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common.Authorization
    }
  },

  async me(): Promise<User> {
    const res = await api.get('/me')
    return res.data
  },
};

export default api;