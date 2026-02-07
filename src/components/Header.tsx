import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/integrations/auth-context'
import { API_ORIGIN } from '@/lib/api'

import { MapPinned, Heart, Home, Ticket, UserCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

export default function Header() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
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

  const displayName = useMemo(() => {
    if (!user) return 'Sign in'
    if (user.username) return user.username
    if (user.email) return user.email.split('@')[0]
    return 'Account'
  }, [user])

  const avatarUrl = useMemo(() => {
    if (!user?.avatar_url) return undefined
    if (user.avatar_url.startsWith('http')) return user.avatar_url
    return `${API_ORIGIN}${user.avatar_url}`
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

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  return (
    <>
      <header className="fixed top-0 left-0 z-50 h-16 w-full p-4 flex items-center bg-gray-800 text-white shadow-lg basis-auto">
        <h1 className="ml-4 text-xl font-semibold flex-1 flex items-center justify-start">
          <Link to="/">
            <img
              src=""
              alt="Encore Logo"
              className="h-10"
            />
          </Link>
        </h1>
        <h1 className="flex-1 flex items-center justify-center">Search Bar</h1>
        <div className="flex-1 flex items-center justify-end gap-3" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {user ? (
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={user.email} />
                <AvatarFallback>{initials || 'U'}</AvatarFallback>
              </Avatar>
            ) : (
              <UserCircle size={28} className="text-gray-300" />
            )}
            <span className="hidden sm:inline">{displayName}</span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-4 top-16 mt-2 w-56 rounded-lg border border-gray-700 bg-gray-900 p-2 shadow-xl"
            >
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block rounded-md px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block rounded-md px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-red-300 hover:bg-gray-800"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block rounded-md px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="block rounded-md px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
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

      <aside
        className={`fixed top-16 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col translate-x-full'`}
      >
        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          {/* Placeholders start */}

          <Link
            to="/followed"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Heart size={20} />
            <span className="font-medium">Followed</span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Ticket size={20} />
            <span className="font-medium">Tickets</span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <MapPinned size={20} />
            <span className="font-medium">Concerts Map</span>
          </Link>

          {/* Placeholders end */}
        </nav>
      </aside>
    </>
  )
}
