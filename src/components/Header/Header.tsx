import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/integrations/auth-context'
import { API_ORIGIN } from '@/lib/api'
import { Moon, Sun, UserCircle } from 'lucide-react'
import logo from '@/encore-logo.svg'
import logoLight from '@/encore-logo-light.svg'

import SearchBar from '@/features/search/components/SearchBar'
import Sidebar from './Sidebar'

export default function Header({ onSelectArtist }: { onSelectArtist?: (a: any) => void }) {
  const { user } = useAuth()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const initials = useMemo(() => {
    if (!user) return 'U'
    const first = user.first_name?.trim()?.[0] || ''
    const last = user.last_name?.trim()?.[0] || ''
    if (first || last) return (first + last).toUpperCase()
    if (user.username) return user.username.trim().slice(0, 2).toUpperCase()
    if (user.email) return user.email.trim().slice(0, 2).toUpperCase()
    return 'U'
  }, [user])

  const avatarUrl = useMemo(() => {
    if (!user?.avatar_url) return undefined
    if (user.avatar_url.startsWith('http')) return user.avatar_url
    return `${API_ORIGIN}${user.avatar_url}`
  }, [user])

  const displayName = useMemo(() => {
    if (!user) return 'Sign in'
    if (user.username) return user.username
    if (user.email) return user.email.split('@')[0]
    return 'Account'
  }, [user])

  useEffect(() => {
    if (!menuOpen) return

    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen])

  useEffect(() => {
    const stored = localStorage.getItem("theme")
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    const initialDark = stored ? stored === "dark" : !!prefersDark
    setDarkMode(initialDark)
    document.documentElement.classList.toggle("dark", initialDark)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
    localStorage.setItem("theme", darkMode ? "dark" : "light")
  }, [darkMode])

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  return (
    <>
      <header
        className="app-header theme-test-header theme-test-topbar h-16 w-full px-4 bg-background text-foreground border-b-[3px] border-border grid grid-cols-[1fr_auto_1fr] items-center"
      >
        <div className="flex items-center justify-start gap-3">
          <a href="/" className="flex items-center gap-2">
            <img src={darkMode ? logoLight : logo} alt="Encore Logo" className="h-9 w-auto block encore-logo" />
            <span className="theme-test-brand">Encore</span>
          </a>
        </div>

        <div className="flex items-center justify-center">
          <SearchBar onSelectArtist={onSelectArtist} />
        </div>

        <div className="flex items-center justify-end gap-2" ref={menuRef}>
          <button
            type="button"
            onClick={() => setDarkMode((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-2.5 py-1.5 text-sm font-semibold text-foreground
              [box-shadow:2px_2px_0_var(--border)] hover:-translate-y-0.5 transition-transform"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="hidden sm:inline">{darkMode ? "Light" : "Dark"}</span>
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-2.5 py-1.5 text-sm font-semibold text-foreground
              [box-shadow:2px_2px_0_var(--border)] hover:-translate-y-0.5 transition-transform"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {user ? (
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={user?.email ?? 'User avatar'} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            ) : (
              <UserCircle className="h-8 w-8 text-foreground" />
            )}
            <span className="hidden sm:inline">{displayName}</span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-4 top-16 mt-2 w-56 rounded-xl border-[3px] border-border bg-card p-2 shadow-2xl z-[70]"
            >
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block rounded-md px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block rounded-md px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-muted"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block rounded-md px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="block rounded-md px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <Sidebar />
    </>
  )
}
