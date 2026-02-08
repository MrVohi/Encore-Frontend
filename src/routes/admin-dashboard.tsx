import { type Artist } from '@/components/artist'
import { ArtistAdminModal } from '@/components/artist-admin'
import { ConcertAdminModal } from '@/components/concerts-admin'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/integrations/auth-context'
import { API_URL } from '@/lib/api'
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
    { id: string; created_at: string; is_verified?: boolean; last_active_at?: string }[]
  >([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)

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
        setUsers(Array.isArray(json) ? json : [])
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
    <div className="min-h-screen bg-background text-foreground admin-pattern">
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
          <div />
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border-[3px] border-border bg-card p-5 [box-shadow:4px_4px_0_var(--border)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Admin CRUD Shortcuts
              </h3>
              <span className="text-xs text-muted-foreground">
                Fast access to core actions
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
                        className="rounded-md border-[3px] border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:brightness-105"
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
                        }}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
    </div>
  )
}
