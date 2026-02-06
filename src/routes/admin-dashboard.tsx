import { type Artist } from '@/components/artist'
import { ArtistAdminModal } from '@/components/artist-admin'
import { ConcertAdminModal } from '@/components/concerts-admin'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/integrations/auth-context'
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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

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
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    )
  }

  const isAdmin = user?.is_admin === true

  if (!user || !isAdmin) {
    if (!loading) {
      navigate({ to: '/' })
    }
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="rounded-lg border border-gray-800 bg-gray-900 px-6 py-4 text-center">
          <p className="text-sm text-gray-300">Admin access only.</p>
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
        const res = await fetch(`${API_URL}/users`, { signal: controller.signal })
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
          borderColor: '#22d3ee',
          backgroundColor: 'rgba(34, 211, 238, 0.15)',
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
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto w-full max-w-6xl px-6 pb-12 pt-24">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-gray-500">
              Admin
            </p>
            <h2 className="text-2xl font-semibold text-white">
              Dashboard Overview
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Manage artists, concerts, and monitor live metrics.
            </p>
          </div>
          <div />
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Admin CRUD Shortcuts
              </h3>
              <span className="text-xs text-gray-500">
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
                  className="rounded-lg border border-gray-800/60 bg-gray-950/40 p-4"
                >
                  <p className="text-sm font-semibold text-white">
                    {card.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{card.desc}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {card.actions.map((action) => (
                      <button
                        key={action}
                        type="button"
                        className="rounded-md border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs text-gray-200 hover:border-gray-700 hover:bg-gray-800"
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

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-white">Users Created</h3>
              <span className="text-xs text-gray-500">Last 14 days</span>
            </div>
            {usersLoading && (
              <p className="mt-4 text-sm text-gray-400">Loading users…</p>
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
                      className="flex items-center justify-between rounded-lg border border-gray-800/60 bg-gray-950/40 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-100">
                          {stat.label}
                        </p>
                        <p className="text-xs text-gray-500">{stat.note}</p>
                      </div>
                      <span className="text-lg font-semibold text-white">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-800/60 bg-gray-950/40 px-4 py-3">
                    <p className="text-xs uppercase tracking-widest text-gray-500">
                      Avg / Day
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {usersStats.total
                        ? Math.round(usersStats.total / 14)
                        : 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-800/60 bg-gray-950/40 px-4 py-3">
                    <p className="text-xs uppercase tracking-widest text-gray-500">
                      Peak Day
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {usersStats.dailyCounts.reduce(
                        (max, d) => (d.count > max.count ? d : max),
                        { date: '--', count: 0 },
                      ).date}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Daily signups (last 14 days)</span>
                    <span>Total: {usersStats.total}</span>
                  </div>
                  <div className="mt-3 h-32 rounded-lg border border-gray-800/60 bg-gray-950/40 p-2">
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
