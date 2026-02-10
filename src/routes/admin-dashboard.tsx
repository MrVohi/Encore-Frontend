import { type Artist } from '@/components/artist'
import { ArtistAdminModal } from '@/components/artist-admin'
import { ConcertAdminModal } from '@/components/concerts-admin'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/integrations/auth-context'
import { API_URL } from '@/lib/api'
import * as Sentry from '@sentry/react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

export const Route = createFileRoute('/admin-dashboard')({
  component: RouteComponent,
})

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
)

function RouteComponent() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [artistModal, setArtistModal] = useState<
    'create' | 'edit' | 'delete' | null
  >(null)
  const [concertModal, setConcertModal] = useState<
    'create' | 'edit' | 'delete' | null
  >(null)
  const [users, setUsers] = useState<
    {
      id: string
      created_at: string
      is_verified?: boolean
      last_active_at?: string
      username?: string
      email?: string
      is_admin?: boolean
    }[]
  >([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [userFlags, setUserFlags] = useState<Record<string, { is_admin?: boolean; banned?: boolean }>>({})
  const [userNotice, setUserNotice] = useState<string | null>(null)
  const [userActionLoading, setUserActionLoading] = useState<Record<string, boolean>>({})
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [userModalMode, setUserModalMode] = useState<'promote' | 'ban' | 'tickets'>('promote')
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({})
  const [artists, setArtists] = useState<Artist[]>([])
  const [artistsLoading, setArtistsLoading] = useState(false)
  const [artistsError, setArtistsError] = useState<string | null>(null)

  const placeholderArtist: Artist = {
    id: 'admin-preview',
    name: 'Sample Artist',
    genre: 'Alt Pop',
    image_url: '',
    preview_url: '',
    created_at: new Date().toISOString(),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  const isAdmin = user?.is_admin === true

  if (!user || !isAdmin) {
    if (!loading) {
      navigate({ to: '/' })
    }
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="rounded-xl border-[3px] border-border bg-card px-6 py-4 text-center [box-shadow:4px_4px_0_var(--border)]">
          <p className="text-sm text-muted-foreground">Admin access only.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const host = document.querySelector('.app-content')
    host?.classList.add('admin-pattern-host')
    return () => host?.classList.remove('admin-pattern-host')
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const loadUsers = async () => {
      setUsersLoading(true)
      setUsersError(null)

      try {
        const token = localStorage.getItem('access_token')
        const res = await fetch(`${API_URL}/users`, {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (!res.ok) throw new Error('Failed to load users')
        const json = await res.json()
        const normalized = Array.isArray(json)
          ? json.map((user) => {
              const record = user as Record<string, unknown>
              return {
                ...user,
                username:
                  (record.username as string | undefined) ??
                  (record.user_name as string | undefined) ??
                  (record.name as string | undefined) ??
                  (record.handle as string | undefined) ??
                  undefined,
              }
            })
          : []
        setUsers(normalized)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setUsers([])
        setUsersError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setUsersLoading(false)
      }
    }

    loadUsers()
    return () => controller.abort()
  }, [API_URL])

  useEffect(() => {
    const controller = new AbortController()

    const loadArtists = async () => {
      setArtistsLoading(true)
      setArtistsError(null)

      try {
        const res = await fetch(`${API_URL}/artists`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Failed to load artists')
        const json = await res.json()
        setArtists(Array.isArray(json) ? (json as Artist[]) : [])
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setArtists([])
        setArtistsError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setArtistsLoading(false)
      }
    }

    loadArtists()
    return () => controller.abort()
  }, [API_URL])

  const usersStats = useMemo(() => {
    const now = new Date()
    const cutoff = new Date(now)
    cutoff.setDate(now.getDate() - 13)

    const inRange = users.filter((u) => {
      const created = new Date(u.created_at)
      return !Number.isNaN(created.getTime()) && created >= cutoff
    })

    const verified = inRange.filter((u) => u.is_verified).length
    const activeToday = users.filter((u) => {
      if (!u.last_active_at) return false
      const last = new Date(u.last_active_at)
      return (
        !Number.isNaN(last.getTime()) &&
        last.toDateString() === now.toDateString()
      )
    }).length

    const dailyCounts = Array.from({ length: 14 }, (_, i) => {
      const day = new Date(cutoff)
      day.setDate(cutoff.getDate() + i)
      const key = day.toDateString()
      const count = inRange.filter((u) => {
        const created = new Date(u.created_at)
        return created.toDateString() === key
      }).length
      return { date: day.toLocaleDateString(), count }
    })

    return {
      total: inRange.length,
      verified,
      activeToday,
      dailyCounts,
    }
  }, [users])

  const usersWithFlags = useMemo(() => {
    return users.map((user) => ({
      ...user,
      is_admin: userFlags[user.id]?.is_admin ?? user.is_admin ?? false,
      banned: userFlags[user.id]?.banned ?? false,
    }))
  }, [users, userFlags])

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const handlePromoteUser = async (id: string) => {
    setUserNotice(null)
    setUserActionLoading((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`${API_URL}/users/${id}/promote`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
      })
      if (!res.ok) throw new Error('Failed to promote user')
      setUserFlags((prev) => ({
        ...prev,
        [id]: { ...(prev[id] ?? {}), is_admin: true },
      }))
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_admin: true } : u)),
      )
    } catch (err) {
      setUserNotice(err instanceof Error ? err.message : 'Failed to promote user')
    } finally {
      setUserActionLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleBanUser = async (id: string) => {
    setUserNotice(null)
    setUserActionLoading((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
      })
      if (!res.ok) throw new Error('Failed to delete user')
      setUsers((prev) => prev.filter((u) => u.id !== id))
      setUserFlags((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch (err) {
      setUserNotice(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setUserActionLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  const topArtistStats = useMemo(() => {
    const asNumber = (value: unknown) => {
      const n = Number(value)
      return Number.isFinite(n) ? n : 0
    }
    const withScore = (
      list: Artist[],
      score: (artist: Artist) => number,
    ) => {
      if (!list.length) return null
      const sorted = [...list].sort((a, b) => score(b) - score(a))
      const best = sorted[0]
      const bestScore = score(best)
      if (!best || bestScore <= 0) return null
      return { artist: best, score: bestScore }
    }

    const followersScore = (artist: Artist) => {
      const raw = artist as Artist & Record<string, unknown>
      return asNumber(raw.followers_count ?? raw.followers ?? raw.followersCount)
    }
    const ticketsScore = (artist: Artist) => {
      const raw = artist as Artist & Record<string, unknown>
      return asNumber(raw.tickets_sold ?? raw.ticketsSold ?? raw.ticket_count ?? raw.tickets)
    }
    const listenersScore = (artist: Artist) => {
      const raw = artist as Artist & Record<string, unknown>
      return asNumber(raw.monthly_listeners ?? raw.listeners ?? raw.plays ?? raw.streams)
    }
    const growthScore = (artist: Artist) => {
      const raw = artist as Artist & Record<string, unknown>
      const direct = asNumber(raw.growth_rate ?? raw.weekly_growth ?? raw.growth)
      if (direct) return direct
      const created = new Date(artist.created_at).getTime()
      return Number.isFinite(created) ? created : 0
    }

    return {
      mostFollowed: withScore(artists, followersScore),
      mostTickets: withScore(artists, ticketsScore),
      mostListeners: withScore(artists, listenersScore),
      fastestGrowth: withScore(artists, growthScore),
    }
  }, [artists])

  const chartData = useMemo(() => {
    return {
      labels: usersStats.dailyCounts.map((d) => d.date),
      datasets: [
        {
          label: 'Daily Signups',
          data: usersStats.dailyCounts.map((d) => d.count),
          borderColor: '#e07a5f',
          backgroundColor: 'rgba(224, 122, 95, 0.18)',
          fill: true,
          tension: 0.35,
          pointRadius: 2,
        },
      ],
    }
  }, [usersStats])

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#6b7280', maxTicksLimit: 7 },
        },
        y: {
          grid: { color: 'rgba(148, 163, 184, 0.1)' },
          ticks: { color: '#6b7280' },
        },
      },
    }),
    [],
  )

  return (
    <div className="min-h-full text-foreground">
      <div className="mx-auto w-full max-w-6xl px-6 pb-12 pt-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              Admin
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              Dashboard Overview
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage artists, concerts, and monitor live metrics.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => {
                Sentry.captureException(new Error('Front Sentry Test'))
              }}
              className="rounded-full border-[3px] border-border bg-card px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-foreground [box-shadow:3px_3px_0_var(--border)] hover:-translate-y-0.5 transition-transform"
            >
              Sentry Test
            </button>
          </div>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border-[3px] border-border bg-card p-5 [box-shadow:4px_4px_0_var(--border)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Admin Tools
              </h3>
              <span className="text-xs text-muted-foreground">
                In-dashboard modals
              </span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: 'Artists',
                  desc: 'Create, edit, or remove artist profiles.',
                  actions: ['Create artist', 'Edit artist', 'Delete artist'],
                },
                {
                  title: 'Concerts',
                  desc: 'Manage concert listings and schedules.',
                  actions: ['Create concert', 'Edit concert', 'Delete concert'],
                },
                {
                  title: 'Users',
                  desc: 'Manage access levels and admin roles.',
                  actions: ['Promote to admin', 'Ban user', 'View tickets (soon)'],
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-lg border-[3px] border-border bg-secondary p-4 [box-shadow:3px_3px_0_var(--border)]"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {card.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.desc}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {card.actions.map((action) => (
                      <button
                        key={action}
                        type="button"
                        className="rounded-md border-[3px] border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={action.includes('(soon)')}
                        onClick={() => {
                          if (card.title === 'Artists') {
                            if (action.toLowerCase().includes('create'))
                              setArtistModal('create')
                            if (action.toLowerCase().includes('edit'))
                              setArtistModal('edit')
                            if (action.toLowerCase().includes('delete'))
                              setArtistModal('delete')
                          }
                          if (card.title === 'Concerts') {
                            if (action.toLowerCase().includes('create'))
                              setConcertModal('create')
                            if (action.toLowerCase().includes('edit'))
                              setConcertModal('edit')
                            if (action.toLowerCase().includes('delete'))
                              setConcertModal('delete')
                          }
                          if (card.title === 'Users') {
                            if (action.toLowerCase().includes('promote')) setUserModalMode('promote')
                            if (action.toLowerCase().includes('ban')) setUserModalMode('ban')
                            if (action.toLowerCase().includes('tickets')) setUserModalMode('tickets')
                            setUserModalOpen(true)
                          }
                        }}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Actions open admin modals.
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border-[3px] border-border bg-card p-5 [box-shadow:4px_4px_0_var(--border)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-foreground">Top Artists</h3>
              <span className="text-xs text-muted-foreground">
                Placeholder categories until analytics ship
              </span>
            </div>
            {artistsLoading && (
              <p className="mt-4 text-sm text-muted-foreground">Loading artists…</p>
            )}
            {artistsError && (
              <p className="mt-4 text-sm text-red-400">Error: {artistsError}</p>
            )}
            {!artistsLoading && !artistsError && (
              <div className="mt-4 grid gap-3">
                {[
                  {
                    label: 'Most followed',
                    detail: 'Highest follower count',
                    entry: topArtistStats.mostFollowed,
                  },
                  {
                    label: 'Most tickets sold',
                    detail: 'Top concert demand',
                    entry: topArtistStats.mostTickets,
                  },
                  {
                    label: 'Fastest growth',
                    detail: 'Biggest weekly gain',
                    entry: topArtistStats.fastestGrowth,
                  },
                ].map((entry) => (
                  <div
                    key={entry.label}
                    className="rounded-lg border-[3px] border-border bg-secondary px-4 py-3 [box-shadow:3px_3px_0_var(--border)]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">
                          {entry.label}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {entry.detail}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {entry.entry?.artist?.name ?? '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border-[3px] border-border bg-card p-5 [box-shadow:4px_4px_0_var(--border)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-foreground">Users Created</h3>
              <span className="text-xs text-muted-foreground">Last 14 days</span>
            </div>
            {usersLoading && (
              <p className="mt-4 text-sm text-muted-foreground">Loading users…</p>
            )}
            {usersError && (
              <p className="mt-4 text-sm text-red-400">Error: {usersError}</p>
            )}
            {!usersLoading && !usersError && (
              <>
                <div className="mt-4 grid gap-3">
                  {[
                    {
                      label: 'New users',
                      value: String(usersStats.total),
                      note: 'Last 14 days',
                    },
                    {
                      label: 'Verified accounts',
                      value: String(usersStats.verified),
                      note: 'Last 14 days',
                    },
                    {
                      label: 'Active today',
                      value: String(usersStats.activeToday),
                      note: 'Daily active',
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center justify-between rounded-lg border-[3px] border-border bg-secondary px-4 py-3 [box-shadow:3px_3px_0_var(--border)]"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {stat.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{stat.note}</p>
                      </div>
                      <span className="text-lg font-semibold text-foreground">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border-[3px] border-border bg-secondary px-4 py-3 [box-shadow:3px_3px_0_var(--border)]">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Avg / Day
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {usersStats.total
                        ? Math.round(usersStats.total / 14)
                        : 0}
                    </p>
                  </div>
                  <div className="rounded-lg border-[3px] border-border bg-secondary px-4 py-3 [box-shadow:3px_3px_0_var(--border)]">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Peak Day
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {usersStats.dailyCounts.reduce(
                        (max, d) => (d.count > max.count ? d : max),
                        { date: '--', count: 0 },
                      ).date}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Daily signups (last 14 days)</span>
                    <span>Total: {usersStats.total}</span>
                  </div>
                  <div className="mt-3 h-32 rounded-lg border-[3px] border-border bg-card p-2">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

      </div>

      <ArtistAdminModal
        artist={placeholderArtist}
        open={artistModal === 'create'}
        onClose={() => setArtistModal(null)}
        mode="create"
      />
      <ArtistAdminModal
        artist={placeholderArtist}
        open={artistModal === 'edit'}
        onClose={() => setArtistModal(null)}
        mode="edit"
      />
      <ArtistAdminModal
        artist={placeholderArtist}
        open={artistModal === 'delete'}
        onClose={() => setArtistModal(null)}
        mode="delete"
      />
      <ConcertAdminModal
        open={concertModal === 'create'}
        onClose={() => setConcertModal(null)}
        mode="create"
      />
      <ConcertAdminModal
        open={concertModal === 'edit'}
        onClose={() => setConcertModal(null)}
        mode="edit"
      />
      <ConcertAdminModal
        open={concertModal === 'delete'}
        onClose={() => setConcertModal(null)}
        mode="delete"
      />
      {userModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-8">
            <div className="relative w-full max-w-5xl rounded-2xl border border-border bg-[color-mix(in_oklab,var(--theme-paper)_92%,var(--background))] text-foreground shadow-2xl admin-modal-surface">
              <div className="flex items-start justify-between border-b border-border px-6 py-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Admin
                  </p>
                  <h2 className="text-xl font-semibold text-foreground">
                    {userModalMode === 'promote'
                      ? 'Promote Users'
                      : userModalMode === 'ban'
                        ? 'Ban Users'
                        : 'User Tickets'}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {userModalMode === 'promote'
                      ? 'Grant admin access to trusted users.'
                      : userModalMode === 'ban'
                        ? 'Disable access for abusive accounts.'
                        : 'Ticket details will appear once the endpoint is ready.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground hover:border-border hover:bg-secondary"
                >
                  Close
                </button>
              </div>

              <div className="max-h-[80vh] overflow-y-auto px-6 py-6">
                {userNotice && (
                  <p className="mb-3 text-xs text-muted-foreground">
                    {userNotice}
                  </p>
                )}
                {usersLoading && (
                  <p className="text-sm text-muted-foreground">Loading users…</p>
                )}
                {usersError && (
                  <p className="text-sm text-red-400">Error: {usersError}</p>
                )}
                {!usersLoading && !usersError && (
                  <div className="grid gap-3">
                    {usersWithFlags.map((user) => {
                      const display =
                        user.username ??
                        user.email ??
                        'Unknown user'
                      const expanded = expandedUsers[user.id]
                      return (
                        <div
                          key={user.id}
                          className="rounded-lg border-[3px] border-border bg-secondary px-4 py-3 [box-shadow:3px_3px_0_var(--border)]"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {display}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Joined{' '}
                                {new Date(
                                  user.created_at,
                                ).toLocaleDateString()}
                              </p>
                              {expanded && (
                                <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                                  <div>Username: {user.username ?? '—'}</div>
                                  {user.email && <div>Email: {user.email}</div>}
                                  <div className="text-[11px] text-muted-foreground">
                                    User ID: {user.id}
                                  </div>
                                  {user.last_active_at && (
                                    <div>
                                      Last active:{' '}
                                      {new Date(user.last_active_at).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {user.is_verified ? (
                                  <span className="rounded-full border border-border bg-card px-2 py-0.5">
                                    Verified
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-border bg-card px-2 py-0.5">
                                    Unverified
                                  </span>
                                )}
                                {user.is_admin && (
                                  <span className="rounded-full border border-border bg-card px-2 py-0.5">
                                    Admin
                                  </span>
                                )}
                                {user.banned && (
                                  <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-red-300">
                                    Banned
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedUsers((prev) => ({
                                    ...prev,
                                    [user.id]: !prev[user.id],
                                  }))
                                }
                                className="rounded-md border-[3px] border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:brightness-105"
                              >
                                {expanded ? 'Hide info' : 'More info'}
                              </button>
                              {userModalMode === 'promote' && (
                                <button
                                  type="button"
                                  onClick={() => handlePromoteUser(user.id)}
                                  disabled={userActionLoading[user.id] || user.is_admin}
                                  className="rounded-md border-[3px] border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {user.is_admin ? 'Admin' : 'Promote to admin'}
                                </button>
                              )}
                              {userModalMode === 'ban' && (
                                <button
                                  type="button"
                                  onClick={() => handleBanUser(user.id)}
                                  disabled={userActionLoading[user.id]}
                                  className="inline-flex items-center justify-center rounded-md border-[3px] border-border bg-red-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  Ban user
                                </button>
                              )}
                              {userModalMode === 'tickets' && (
                                <button
                                  type="button"
                                  disabled
                                  className="rounded-md border-[3px] border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground disabled:opacity-50"
                                >
                                  View tickets (soon)
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {!usersWithFlags.length && (
                      <p className="text-sm text-muted-foreground">
                        No users found.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
