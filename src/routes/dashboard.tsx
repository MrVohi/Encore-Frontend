import { useMemo } from 'react'
import { useAuth } from '../integrations/auth-context'
import { Route as LoginRoute } from './login'
import { useNavigate, createFileRoute, Link } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { API_ORIGIN } from '../lib/api'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})


export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = useMemo(() => {
    if (!user) return 'U'
    const first = user.first_name?.trim()?.[0] || ''
    const last = user.last_name?.trim()?.[0] || ''
    if (first || last) return (first + last).toUpperCase()
    if (user.username) return user.username.trim().slice(0, 2).toUpperCase()
    if (user.email) return user.email.trim().slice(0, 2).toUpperCase()
    return 'U'
  }, [user])

  const handleLogout = () => {
    logout()
    navigate({ to: LoginRoute.to })
  }

  const avatarUrl = useMemo(() => {
    if (!user?.avatar_url) return undefined
    if (user.avatar_url.startsWith('http')) return user.avatar_url
    return `${API_ORIGIN}${user.avatar_url}`
  }, [user])

  if (!user) {
    return null
  }

  return (
    <div className="pt-24 min-h-screen bg-[#1f232b] text-white py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <section className="rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 shadow-lg border border-gray-800">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <Avatar className="h-16 w-16 text-2xl">
                <AvatarImage src={avatarUrl} alt={user.email} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">Profile</h1>
                <p className="text-gray-300">
                  {user.first_name || user.last_name
                    ? `${user.first_name} ${user.last_name}`.trim()
                    : user.username || user.email.split('@')[0]}
                </p>
                <p className="text-sm text-gray-400">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {user.is_email_verified ? (
                <span className="inline-flex items-center rounded-full border border-green-700 bg-green-900/40 px-3 py-1 text-xs text-green-300">
                  Email verified
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-yellow-700 bg-yellow-900/30 px-3 py-1 text-xs text-yellow-300">
                  Email not verified
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-gray-800 p-6 shadow-md border border-gray-700">
            <h2 className="text-lg font-semibold mb-3">Account details</h2>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Email</span>
                <span>{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Member since</span>
                <span>
                  {user.created_at && !Number.isNaN(Date.parse(user.created_at))
                    ? new Date(user.created_at).toLocaleDateString('en-US')
                    : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gray-800 p-6 shadow-md border border-gray-700">
            <h2 className="text-lg font-semibold mb-3">Verification</h2>
            <p className="text-sm text-gray-300 mb-4">
              Verified accounts can access checkout and ticket purchases.
            </p>
            {user.is_email_verified ? (
              <div className="rounded-lg border border-green-700 bg-green-900/30 px-3 py-2 text-sm text-green-200">
                Your email is verified.
              </div>
            ) : (
              <div className="rounded-lg border border-yellow-700 bg-yellow-900/30 px-3 py-2 text-sm text-yellow-200">
                Please verify your email to unlock payments.
              </div>
            )}
            {!user.is_email_verified && (
              <div className="mt-4">
                <Link
                  to="/verify-email"
                  className="inline-flex items-center justify-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
                >
                  Verify email
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-gray-800 p-6 shadow-md border border-gray-700">
            <h2 className="text-lg font-semibold mb-3">Quick actions</h2>
            <div className="flex flex-col gap-3">
              <Link
                to="/settings"
                className="inline-flex items-center justify-center rounded-md border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
              >
                Edit settings
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
