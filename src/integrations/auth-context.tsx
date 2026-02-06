import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

import type { User, AuthContextType, LoginData, RegisterData } from '../lib/auth-types'
import { authService } from '../lib/api'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const hardLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    authService.setAccessToken(null)
    setUser(null)
  }

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token')
    if (!accessToken) {
      setLoading(false)
      return
    }

    // ensure requests actually use the stored token
    authService.setAccessToken(accessToken)

      ; (async () => {
        try {
          // Prefer real backend truth instead of trusting localStorage user
          const me = await authService.me() // GET  
          setUser(me)
          localStorage.setItem('user', JSON.stringify(me))
        } catch {
          hardLogout()
        } finally {
          setLoading(false)
        }
      })()
  }, [])

  const login = async (data: LoginData) => {
    const response = await authService.login(data)

    localStorage.setItem('access_token', response.access_token)
    localStorage.setItem('refresh_token', response.refresh_token)
    localStorage.setItem('user', JSON.stringify(response.user))

    authService.setAccessToken(response.access_token)
    setUser(response.user)
  }

  const register = async (data: RegisterData) => {
    const response = await authService.register(data)

    localStorage.setItem('access_token', response.access_token)
    localStorage.setItem('refresh_token', response.refresh_token)
    localStorage.setItem('user', JSON.stringify(response.user))

    authService.setAccessToken(response.access_token)
    setUser(response.user)
  }

  const logout = () => {
    hardLogout()
  }

  const refreshUser = async () => {
    try {
      const me = await authService.me()
      setUser(me)
      localStorage.setItem('user', JSON.stringify(me))
    } catch {
      hardLogout()
    }
  }

  const googleLogin = async () => {
    const url = await authService.getGoogleLoginUrl()
    window.location.href = url
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    googleLogin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
