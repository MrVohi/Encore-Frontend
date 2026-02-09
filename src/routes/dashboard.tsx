import { useMemo } from 'react'
import { useAuth } from '../integrations/auth-context'
import { Route as LoginRoute } from './login'
import { useNavigate, createFileRoute, Link } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { resolveAssetUrl } from '../lib/api'

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

  const avatarUrl = useMemo(() => resolveAssetUrl(user?.avatar_url) || undefined, [user])

  if (!user) {
    return null
  }

  return (
    <div className="pt-0 pb-16 min-h-screen bg-background text-foreground px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <section className="rounded-2xl bg-card p-6 shadow-lg border border-border">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <Avatar className="h-16 w-16 text-2xl">
                <AvatarImage src={avatarUrl} alt={user.email} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">Profile</h1>
                <p className="text-muted-foreground">
                  {user.first_name || user.last_name
                    ? `${user.first_name} ${user.last_name}`.trim()
                    : user.username || user.email.split('@')[0]}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {user.is_email_verified ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--encore-primary)] bg-[var(--encore-bg-cream)] px-3 py-1 text-xs text-[var(--encore-text-dark)]">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  Email verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--encore-accent-warm)_55%,var(--border))] bg-[color-mix(in_oklab,var(--encore-accent-warm)_12%,var(--encore-bg-cream))] px-3 py-1 text-xs text-[var(--encore-text-dark)]">
                  <span className="inline-flex h-2 w-2 rounded-full bg-[var(--encore-accent-warm)]" />
                  Email not verified
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-card p-6 shadow-md border border-border">
            <h2 className="text-lg font-semibold mb-3">Account details</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Member since</span>
                <span>
                  {user.created_at && !Number.isNaN(Date.parse(user.created_at))
                    ? new Date(user.created_at).toLocaleDateString('en-US')
                    : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-md border border-border">
            <h2 className="text-lg font-semibold mb-3">Verification</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Verified accounts can access checkout and ticket purchases.
            </p>
            {user.is_email_verified ? (
              <div className="rounded-lg border border-[var(--encore-primary)] bg-[var(--encore-bg-cream)] px-3 py-2 text-sm text-[var(--encore-text-dark)]">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Your email is verified.
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-[color-mix(in_oklab,var(--encore-accent-warm)_55%,var(--border))] bg-[color-mix(in_oklab,var(--encore-accent-warm)_12%,var(--encore-bg-cream))] px-3 py-2 text-sm text-[var(--encore-text-dark)]">
                Please verify your email to unlock payments.
              </div>
            )}
            {!user.is_email_verified && (
              <div className="mt-4">
                <Link
                  to="/verify-email"
                  className="inline-flex items-center justify-center rounded-md border-[3px] border-border bg-[var(--encore-accent-warm)] px-4 py-2 text-sm font-extrabold text-white hover:brightness-110"
                >
                  Verify email
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-md border border-border">
            <h2 className="text-lg font-semibold mb-3">Quick actions</h2>
            <div className="flex flex-col gap-3">
              <Link
                to="/settings"
                className="inline-flex items-center justify-center rounded-md border-[3px] border-border bg-secondary px-4 py-2 text-sm font-semibold text-foreground hover:brightness-105"
              >
                Edit settings
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-md border-[3px] border-border bg-red-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-red-700"
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
