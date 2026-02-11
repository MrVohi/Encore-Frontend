import axios from 'axios'
import type { AuthResponse, LoginData, RegisterData, User } from './auth-types'
import { getApiErrorMessage } from './errors'

const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
const RAW_BACKEND_BASE_URL = (import.meta.env.VITE_BACKEND_BASE_URL ?? RAW_API_BASE_URL).trim()
const BACKEND_BASE_URL = RAW_BACKEND_BASE_URL.replace(/\/$/, '').replace(/\/api\/?$/, '')
const RAW_R2_PUBLIC_BASE_URL = (import.meta.env.VITE_R2_PUBLIC_BASE_URL ?? '').trim()
const R2_PUBLIC_BASE_URL = RAW_R2_PUBLIC_BASE_URL.replace(/\/$/, '')
const ASSET_BASE_URL = R2_PUBLIC_BASE_URL || BACKEND_BASE_URL

export const API_URL = BACKEND_BASE_URL ? `${BACKEND_BASE_URL}/api` : '/api'
export const API_ORIGIN = BACKEND_BASE_URL

export const resolveAssetUrl = (value?: string | null) => {
  const raw = String(value ?? "").trim()
  if (!raw) return ""
  if (raw === "None" || raw === "null" || raw === "undefined") return ""

  try {
    const u = new URL(raw)
    if (u.pathname.startsWith("/uploads/")) {
      return ASSET_BASE_URL ? `${ASSET_BASE_URL}${u.pathname}${u.search}` : u.pathname + u.search
    }
    return raw
  } catch { }

  if (/^https?:\/\//i.test(raw)) return raw

  const normalized = raw.startsWith("/") ? raw : `/${raw}`
  if (normalized.startsWith("/uploads/")) {
    return ASSET_BASE_URL ? `${ASSET_BASE_URL}${normalized}` : normalized
  }

  if (ASSET_BASE_URL) return `${ASSET_BASE_URL}${normalized}`
  return normalized
}


const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })

          const { access_token } = response.data
          localStorage.setItem('access_token', access_token)

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    const message = getApiErrorMessage(error?.response?.data, error?.message)
    if (message && typeof error === 'object') {
      error.message = message
    }

    return Promise.reject(error)
  },
)

export const authService = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  verifyEmail: async (token: string): Promise<void> => {
    await api.get(`/auth/verify-email?token=${token}`)
  },

  uploadAvatar: async (file: File): Promise<User> => {
    const form = new FormData()
    form.append('avatar', file)
    const response = await api.post('/auth/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  deleteAvatar: async (): Promise<User> => {
    const response = await api.delete('/auth/avatar')
    return response.data
  },

  updateProfile: async (data: { username?: string; first_name?: string; last_name?: string }): Promise<User> => {
    const response = await api.put('/auth/profile', data)
    return response.data
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
  },

  resendVerification: async (email: string): Promise<void> => {
    await api.post('/auth/resend-verification', { email })
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email })
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
  },

  getGoogleLoginUrl: async (): Promise<string> => {
    const response = await api.get('/auth/google')
    return response.data.url
  },

  googleCallback: async (code: string): Promise<AuthResponse> => {
    const response = await api.get(`/auth/google/callback?code=${code}`)
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get('/me')
    return response.data
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
}

export default api
