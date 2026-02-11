import { type Artist } from '@/components/artist'
import { ArtistAdminModal } from '@/components/artist-admin'
import { ConcertAdminModal } from '@/components/concerts-admin'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
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

type AdminTicket = {
  id: string
  user_id: string
  user_email?: string
  concert_id: string
  artist?: string
  when?: string
  city?: string
  country?: string
  seat?: string
  status?: string
  issued_at?: string
  ticket_type_id?: string
  ticket_type?: string
  price?: number | string
}

type TicketStats = {
  total: number
  active: number
  used: number
}

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
  const [artists, setArtists] = useState<Artist[]>([])
  const [artistsLoading, setArtistsLoading] = useState(false)
  const [artistsError, setArtistsError] = useState<string | null>(null)
  const [tickets, setTickets] = useState<AdminTicket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [ticketsError, setTicketsError] = useState<string | null>(null)
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null)
  const [ticketStatsLoading, setTicketStatsLoading] = useState(false)
  const [ticketStatsError, setTicketStatsError] = useState<string | null>(null)
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [ticketModalMode, setTicketModalMode] = useState<'create' | 'edit'>('create')
  const [ticketModalSource, setTicketModalSource] = useState<'tickets' | 'user'>('tickets')
  const ticketFormRef = useRef<HTMLFormElement | null>(null)
  const [ticketNotice, setTicketNotice] = useState<string | null>(null)
  const [ticketActionLoading, setTicketActionLoading] = useState(false)
  const [ticketForm, setTicketForm] = useState({
    id: '',
    user_id: '',
    concert_id: '',
    seat: '',
    status: '',
    ticket_type_id: '',
    price: '',
  })
  const [ticketConcerts, setTicketConcerts] = useState<
    Array<{ id: string; artist?: string; city?: string; country?: string; when?: string }>
  >([])
  const [ticketConcertsLoading, setTicketConcertsLoading] = useState(false)
  const [ticketConcertsError, setTicketConcertsError] = useState<string | null>(null)

  const closeUserModal = () => {
    setUserModalOpen(false)
    setUserNotice(null)
  }

  const isAdmin = user?.is_admin === true

  useEffect(() => {
    if (!isAdmin) return
    const host = document.querySelector('.app-content')
    host?.classList.add('admin-pattern-host')
    return () => host?.classList.remove('admin-pattern-host')
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) return
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
  }, [API_URL, isAdmin])

  useEffect(() => {
    if (!isAdmin) return
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
  }, [API_URL, isAdmin])

  useEffect(() => {
    if (!isAdmin) return
    const controller = new AbortController()

    const loadTickets = async () => {
      setTicketsLoading(true)
      setTicketsError(null)
      try {
        const res = await fetch(`${API_URL}/tickets/admin`, {
          signal: controller.signal,
          headers: { ...getAuthHeader() },
        })
        if (!res.ok) throw new Error('Failed to load tickets')
        const json = await res.json()
        setTickets(Array.isArray(json) ? (json as AdminTicket[]) : [])
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setTickets([])
        setTicketsError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setTicketsLoading(false)
      }
    }

    const loadTicketStats = async () => {
      setTicketStatsLoading(true)
      setTicketStatsError(null)
      try {
        const res = await fetch(`${API_URL}/tickets/admin/stats`, {
          signal: controller.signal,
          headers: { ...getAuthHeader() },
        })
        if (!res.ok) throw new Error('Failed to load ticket stats')
        const json = await res.json()
        setTicketStats(json as TicketStats)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setTicketStats(null)
        setTicketStatsError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setTicketStatsLoading(false)
      }
    }

    loadTickets()
    loadTicketStats()
    return () => controller.abort()
  }, [API_URL, isAdmin])

  useEffect(() => {
    if (!isAdmin || !ticketModalOpen) return
    const controller = new AbortController()

    const loadConcerts = async () => {
      setTicketConcertsLoading(true)
      setTicketConcertsError(null)
      try {
        const res = await fetch(`${API_URL}/concerts`, {
          signal: controller.signal,
          headers: { ...getAuthHeader() },
        })
        if (!res.ok) throw new Error('Failed to load concerts')
        const json = await res.json()
        setTicketConcerts(Array.isArray(json) ? json : [])
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setTicketConcerts([])
        setTicketConcertsError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setTicketConcertsLoading(false)
      }
    }

    loadConcerts()
    return () => controller.abort()
  }, [API_URL, isAdmin, ticketModalOpen])

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

  const ticketsByUser = useMemo(() => {
    const map = new Map<string, AdminTicket[]>()
    tickets.forEach((ticket) => {
      if (!ticket.user_id) return
      const list = map.get(ticket.user_id) ?? []
      list.push(ticket)
      map.set(ticket.user_id, list)
    })
    return map
  }, [tickets])

  const usersWithFlags = useMemo(() => {
    return users.map((user) => ({
      ...user,
      is_admin: userFlags[user.id]?.is_admin ?? user.is_admin ?? false,
      banned: userFlags[user.id]?.banned ?? false,
    }))
  }, [users, userFlags])

  const ticketsByArtist = useMemo(() => {
    const counts = new Map<string, number>()
    tickets.forEach((ticket) => {
      const name = ticket.artist?.trim()
      if (!name) return
      const key = name.toLowerCase()
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })
    return counts
  }, [tickets])

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
      setUserNotice('User promoted successfully')
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
      setUserNotice('User banned successfully')
    } catch (err) {
      setUserNotice(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setUserActionLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  const formatStatusLabel = (value?: string | null) => {
    if (!value) return 'Unknown'
    return String(value)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase())
  }

  const openTicketModal = (mode: 'create' | 'edit', ticket?: AdminTicket, userId?: string) => {
    setTicketNotice(null)
    setTicketModalMode(mode)
    setTicketModalSource(userId ? 'user' : 'tickets')
    setTicketForm({
      id: ticket?.id ?? '',
      user_id: userId ?? ticket?.user_id ?? '',
      concert_id: ticket?.concert_id ?? '',
      seat: ticket?.seat ?? '',
      status: ticket?.status ?? '',
      ticket_type_id: ticket?.ticket_type_id ?? ticket?.ticket_type ?? '',
      price: ticket?.price ? String(ticket.price) : '',
    })
    setTicketModalOpen(true)
  }

  const openArtistModal = (mode: 'create' | 'edit' | 'delete') => {
    setArtistModal(mode)
  }

  const openConcertModal = (mode: 'create' | 'edit' | 'delete') => {
    setConcertModal(mode)
  }

  const handleCreateTicket = async () => {
    if (ticketFormRef.current && !ticketFormRef.current.reportValidity()) return
    setTicketActionLoading(true)
    setTicketNotice(null)
    try {
      const priceValue = ticketForm.price.trim()
      const parsedPrice = Number(priceValue)
      const price = priceValue && Number.isFinite(parsedPrice) ? parsedPrice : undefined
      const res = await fetch(`${API_URL}/tickets/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          user_id:
            ticketModalSource === 'user' ? ticketForm.user_id.trim() || undefined : undefined,
          concert_id: ticketForm.concert_id.trim(),
          seat: ticketModalSource === 'user' ? ticketForm.seat.trim() || undefined : undefined,
          status: ticketModalSource === 'user' ? ticketForm.status.trim() || undefined : undefined,
          ticket_type_id: ticketForm.ticket_type_id.trim() || undefined,
          price,
        }),
      })
      if (!res.ok) throw new Error('Failed to create ticket')
      const json = (await res.json()) as AdminTicket
      setTickets((prev) => [json, ...prev])
      setTicketModalOpen(false)
    } catch (err) {
      setTicketNotice(err instanceof Error ? err.message : 'Failed to create ticket')
    } finally {
      setTicketActionLoading(false)
    }
  }

  const handleUpdateTicket = async () => {
    if (!ticketForm.id) return
    if (ticketFormRef.current && !ticketFormRef.current.reportValidity()) return
    setTicketActionLoading(true)
    setTicketNotice(null)
    try {
      const priceValue = ticketForm.price.trim()
      const parsedPrice = Number(priceValue)
      const price = priceValue && Number.isFinite(parsedPrice) ? parsedPrice : undefined
      const res = await fetch(`${API_URL}/tickets/admin/${ticketForm.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          user_id:
            ticketModalSource === 'user' ? ticketForm.user_id.trim() || undefined : undefined,
          concert_id: ticketForm.concert_id.trim(),
          seat: ticketModalSource === 'user' ? ticketForm.seat.trim() || undefined : undefined,
          status: ticketModalSource === 'user' ? ticketForm.status.trim() || undefined : undefined,
          ticket_type_id: ticketForm.ticket_type_id.trim() || undefined,
          price,
        }),
      })
      if (!res.ok) throw new Error('Failed to update ticket')
      const json = (await res.json()) as AdminTicket
      setTickets((prev) => prev.map((t) => (t.id === json.id ? json : t)))
      setTicketModalOpen(false)
    } catch (err) {
      setTicketNotice(err instanceof Error ? err.message : 'Failed to update ticket')
    } finally {
      setTicketActionLoading(false)
    }
  }

  const handleDeleteTicket = async (id: string) => {
    setTicketNotice(null)
    try {
      const res = await fetch(`${API_URL}/tickets/admin/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
      })
      if (!res.ok) throw new Error('Failed to delete ticket')
      setTickets((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      setTicketNotice(err instanceof Error ? err.message : 'Failed to delete ticket')
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
      const fromTickets = ticketsByArtist.get(artist.name.trim().toLowerCase())
      if (fromTickets) return fromTickets
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

    const mostTickets = withScore(artists, ticketsScore)
    if (!mostTickets && ticketsByArtist.size) {
      const top = Array.from(ticketsByArtist.entries()).sort((a, b) => b[1] - a[1])[0]
      if (top) {
        const [name] = top
        return {
          mostFollowed: withScore(artists, followersScore),
          mostTickets: {
            artist: {
              id: `tickets-${name}`,
              name: name.replace(/\b\w/g, (m) => m.toUpperCase()),
              genre: '',
              image_url: '',
              preview_url: '',
              created_at: new Date().toISOString(),
            } as Artist,
            score: top[1],
          },
          mostListeners: withScore(artists, listenersScore),
          fastestGrowth: withScore(artists, growthScore),
        }
      }
    }
    return {
      mostFollowed: withScore(artists, followersScore),
      mostTickets,
      mostListeners: withScore(artists, listenersScore),
      fastestGrowth: withScore(artists, growthScore),
    }
  }, [artists, ticketsByArtist])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

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

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
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
                  actions: ['Promote to admin', 'Ban user', 'View tickets'],
                },
                {
                  title: 'Tickets',
                  desc: 'Issue, update, and review tickets.',
                  actions: ['Create ticket', 'Manage tickets'],
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
                              openArtistModal('create')
                            if (action.toLowerCase().includes('edit')) openArtistModal('edit')
                            if (action.toLowerCase().includes('delete')) openArtistModal('delete')
                          }
                          if (card.title === 'Concerts') {
                            if (action.toLowerCase().includes('create'))
                              openConcertModal('create')
                            if (action.toLowerCase().includes('edit'))
                              openConcertModal('edit')
                            if (action.toLowerCase().includes('delete'))
                              openConcertModal('delete')
                          }
                          if (card.title === 'Users') {
                            if (action.toLowerCase().includes('promote')) setUserModalMode('promote')
                            if (action.toLowerCase().includes('ban')) setUserModalMode('ban')
                            if (action.toLowerCase().includes('tickets')) setUserModalMode('tickets')
                            setUserNotice(null)
                            setUserModalOpen(true)
                          }
                          if (card.title === 'Tickets') {
                            if (action.toLowerCase().includes('create')) openTicketModal('create')
                            if (action.toLowerCase().includes('manage')) {
                              const next = tickets[0]
                              if (next) openTicketModal('edit', next)
                              else openTicketModal('create')
                            }
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

          <div className="rounded-xl border-[3px] border-border bg-card p-5 [box-shadow:4px_4px_0_var(--border)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-foreground">Tickets Overview</h3>
              <span className="text-xs text-muted-foreground">Admin stats</span>
            </div>

            {ticketStatsLoading && (
              <p className="mt-4 text-sm text-muted-foreground">Loading ticket stats…</p>
            )}
            {ticketStatsError && (
              <p className="mt-4 text-sm text-red-400">Error: {ticketStatsError}</p>
            )}
            {!ticketStatsLoading && !ticketStatsError && ticketStats && (
              <div className="mt-4 grid gap-3">
                {[
                  { label: 'Total tickets', value: ticketStats.total },
                  { label: 'Active tickets', value: ticketStats.active },
                  { label: 'Used tickets', value: ticketStats.used },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between rounded-lg border-[3px] border-border bg-secondary px-4 py-3 [box-shadow:3px_3px_0_var(--border)]"
                  >
                    <span className="text-sm font-medium text-foreground">{stat.label}</span>
                    <span className="text-lg font-semibold text-foreground">{stat.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        <section className="mt-8">
          <div className="rounded-xl border-[3px] border-border bg-card p-5 [box-shadow:4px_4px_0_var(--border)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-foreground">Ticket Records</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {tickets.length} total
                </span>
                <button
                  type="button"
                  onClick={() => openTicketModal('create')}
                  className="rounded-md border-[3px] border-border bg-[var(--encore-accent-warm)] px-3 py-1.5 text-xs font-extrabold text-white [box-shadow:3px_3px_0_var(--border)] hover:-translate-y-0.5 transition-transform"
                >
                  Create ticket
                </button>
              </div>
            </div>

            {ticketsLoading && (
              <p className="mt-4 text-sm text-muted-foreground">Loading tickets…</p>
            )}
            {ticketsError && (
              <p className="mt-4 text-sm text-red-400">Error: {ticketsError}</p>
            )}
            {!ticketsLoading && !ticketsError && (
              <div className="mt-4 grid gap-3">
                {tickets.length ? (
                  tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="rounded-lg border-[3px] border-border bg-secondary px-4 py-3 [box-shadow:3px_3px_0_var(--border)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {ticket.artist ?? 'Unknown artist'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {ticket.when ? new Date(ticket.when).toLocaleString() : 'Unknown date'} · {ticket.city ?? '—'}, {ticket.country ?? '—'}
                          </div>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span>User: {ticket.user_email ?? ticket.user_id}</span>
                  <span>Seat: {ticket.seat ?? '—'}</span>
                  <span>Type: {ticket.ticket_type_id ?? ticket.ticket_type ?? '—'}</span>
                  <span>Price: {ticket.price ?? '—'}</span>
                </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {formatStatusLabel(ticket.status)}
                          </span>
                          <button
                            type="button"
                            onClick={() => openTicketModal('edit', ticket)}
                            className="rounded-md border-[3px] border-border bg-card px-3 py-1 text-xs font-semibold text-foreground hover:brightness-105"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="rounded-md border-[3px] border-border bg-red-600 px-3 py-1 text-xs font-extrabold text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {ticket.issued_at && (
                        <div className="mt-2 text-[11px] text-muted-foreground">
                          Issued: {new Date(ticket.issued_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No tickets found.</div>
                )}
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Artist Modal */}
      {/*
        Previous inline artist modal retained as backup:
        (see git history in this file above this block).
      */}
      <ArtistAdminModal
        artist={null}
        open={artistModal === 'create'}
        onClose={() => setArtistModal(null)}
        mode="create"
      />
      <ArtistAdminModal
        artist={null}
        open={artistModal === 'edit'}
        onClose={() => setArtistModal(null)}
        mode="edit"
      />
      <ArtistAdminModal
        artist={null}
        open={artistModal === 'delete'}
        onClose={() => setArtistModal(null)}
        mode="delete"
      />

      {/* Concert Modal */}
      {/*
        Previous inline concert modal retained as backup:
        (see git history in this file above this block).
      */}
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

      {/* User Modal */}
      {userModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-8">
            <div
              className="relative w-full max-w-4xl rounded-2xl border border-border text-foreground shadow-2xl admin-modal-surface"
              style={{ backgroundColor: 'var(--background)' }}
            >
              <div className="admin-modal-backdrop" style={{ backgroundColor: 'var(--background)' }} aria-hidden="true" />
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
                        : 'Ticket records are available in the Tickets section below.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeUserModal}
                  className="admin-modal-close rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-[var(--encore-accent-warm)] hover:bg-[var(--encore-accent-warm)] hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="px-6 py-6 space-y-4">
                {userNotice && (
                  <p className="text-xs text-muted-foreground mb-4">
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
                  <div className="max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border">
                        <tr className="text-left">
                          <th className="pb-2 pr-4 font-semibold text-muted-foreground">User</th>
                          <th className="pb-2 pr-4 font-semibold text-muted-foreground">Email</th>
                          <th className="pb-2 pr-4 font-semibold text-muted-foreground">Joined</th>
                          <th className="pb-2 pr-4 font-semibold text-muted-foreground">Status</th>
                          <th className="pb-2 font-semibold text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersWithFlags.map((user) => {
                          const userTickets = ticketsByUser.get(user.id) ?? []
                          return (
                            <Fragment key={user.id}>
                              <tr className="border-b border-border/50">
                                <td className="py-3 pr-4">
                                  <span className="text-foreground font-medium">
                                    {user.username || 'Unknown'}
                                  </span>
                                </td>
                                <td className="py-3 pr-4 text-muted-foreground">
                                  {user.email || '—'}
                                </td>
                                <td className="py-3 pr-4 text-muted-foreground">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="py-3 pr-4">
                                  <div className="flex flex-wrap gap-1">
                                    {user.is_verified && (
                                      <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px]">
                                        Verified
                                      </span>
                                    )}
                                    {user.is_admin && (
                                      <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px]">
                                        Admin
                                      </span>
                                    )}
                                    {user.banned && (
                                      <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] text-red-300">
                                        Banned
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3">
                                  <div className="flex gap-2">
                                    {userModalMode === 'promote' && (
                                      <button
                                        type="button"
                                        onClick={() => handlePromoteUser(user.id)}
                                        disabled={userActionLoading[user.id] || user.is_admin}
                                        className="rounded-md border-[3px] border-border bg-card px-3 py-1 text-xs font-semibold text-foreground hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {user.is_admin ? 'Admin' : 'Promote'}
                                      </button>
                                    )}
                                    {userModalMode === 'ban' && (
                                      <button
                                        type="button"
                                        onClick={() => handleBanUser(user.id)}
                                        disabled={userActionLoading[user.id]}
                                        className="rounded-md border-[3px] border-border bg-red-600 px-3 py-1 text-xs font-extrabold text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                      >
                                        Ban
                                      </button>
                                    )}
                                    {userModalMode === 'tickets' && (
                                      <div className="flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            closeUserModal()
                                            openTicketModal('create', undefined, user.id)
                                          }}
                                          className="rounded-md border-[3px] border-border bg-card px-3 py-1 text-xs font-semibold text-foreground hover:brightness-105"
                                        >
                                          Add ticket
                                        </button>
                                        <span className="text-xs text-muted-foreground">
                                          {userTickets.length} tickets
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {userModalMode === 'tickets' && (
                                <tr className="border-b border-border/50">
                                  <td colSpan={5} className="pb-4">
                                    {userTickets.length ? (
                                      <div className="grid gap-2 sm:grid-cols-2">
                                        {userTickets.map((ticket) => (
                                          <div
                                            key={ticket.id}
                                            className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground"
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <div>
                                                <div className="text-foreground font-semibold">
                                                  {ticket.artist ?? 'Unknown artist'}
                                                </div>
                                                <div>
                                                  {ticket.city ?? '—'} {ticket.country ?? ''}
                                                </div>
                                                {ticket.when && (
                                                  <div>
                                                    {new Date(ticket.when).toLocaleString()}
                                                  </div>
                                                )}
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteTicket(ticket.id)}
                                                className="rounded-md border border-border bg-red-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-red-700"
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-muted-foreground">
                                        No tickets found.
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                    {!usersWithFlags.length && (
                      <p className="text-sm text-muted-foreground mt-4 text-center">
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

      {/* Ticket Modal */}
      {ticketModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-8">
            <div
              className="relative w-full max-w-2xl rounded-2xl border border-border text-foreground shadow-2xl admin-modal-surface"
              style={{ backgroundColor: 'var(--background)' }}
            >
              <div className="admin-modal-backdrop" style={{ backgroundColor: 'var(--background)' }} aria-hidden="true" />
              <div className="flex items-start justify-between border-b border-border px-6 py-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Tickets
                  </p>
                  <h2 className="text-xl font-semibold text-foreground">
                    {ticketModalMode === 'create' ? 'Create Ticket' : 'Edit Ticket'}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ticketModalMode === 'create'
                      ? ticketModalSource === 'user'
                        ? 'Assign a ticket to this user.'
                        : 'Create a ticket for a concert.'
                      : 'Update ticket details.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTicketModalOpen(false)}
                  className="admin-modal-close rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-[var(--encore-accent-warm)] hover:bg-[var(--encore-accent-warm)] hover:text-white"
                >
                  Close
                </button>
              </div>

              <form
                ref={ticketFormRef}
                className="px-6 py-6 space-y-4"
                onSubmit={(e) => e.preventDefault()}
              >
                {ticketNotice && (
                  <p className="text-xs text-red-400">{ticketNotice}</p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {ticketModalSource === 'user' && (
                    <label className="text-xs font-semibold text-muted-foreground sm:col-span-2">
                      User
                      <select
                        value={ticketForm.user_id}
                        onChange={(e) =>
                          setTicketForm((prev) => ({
                            ...prev,
                            user_id: e.target.value,
                          }))
                        }
                        disabled
                        required
                        className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-70"
                      >
                        <option value="">
                          {usersLoading ? 'Loading users…' : 'Choose a user'}
                        </option>
                        {usersWithFlags.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.username || u.email || u.id}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="text-xs font-semibold text-muted-foreground sm:col-span-2">
                    Concert
                    <select
                      value={ticketForm.concert_id}
                      onChange={(e) =>
                        setTicketForm((prev) => ({
                          ...prev,
                          concert_id: e.target.value,
                        }))
                      }
                      required
                      className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                    >
                      <option value="">
                        {ticketConcertsLoading ? 'Loading concerts…' : 'Choose a concert'}
                      </option>
                      {ticketConcerts.map((concert) => {
                        const label = [
                          concert.city,
                          concert.country,
                          concert.when ? new Date(concert.when).toLocaleDateString() : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')
                        return (
                          <option key={concert.id} value={concert.id}>
                            {label || concert.id}
                          </option>
                        )
                      })}
                    </select>
                    {ticketConcertsError && (
                      <span className="mt-1 block text-xs text-red-400">
                        {ticketConcertsError}
                      </span>
                    )}
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Ticket Type
                    <input
                      value={ticketForm.ticket_type_id}
                      onChange={(e) =>
                        setTicketForm((prev) => ({ ...prev, ticket_type_id: e.target.value }))
                      }
                      required
                      list="ticket-type-options"
                      placeholder="Standard, VIP, Deluxe..."
                      className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                    <datalist id="ticket-type-options">
                      <option value="Standard" />
                      <option value="VIP" />
                      <option value="Deluxe" />
                    </datalist>
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Price
                    <input
                      type="number"
                      step="0.01"
                      value={ticketForm.price}
                      onChange={(e) => setTicketForm((prev) => ({ ...prev, price: e.target.value }))}
                      required
                      placeholder="0.00"
                      className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </label>
                  {ticketModalSource === 'user' && (
                    <>
                      <label className="text-xs font-semibold text-muted-foreground">
                        Seat
                        <input
                          value={ticketForm.seat}
                          onChange={(e) => setTicketForm((prev) => ({ ...prev, seat: e.target.value }))}
                          placeholder="GA or A12"
                          className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                        />
                      </label>
                      <label className="text-xs font-semibold text-muted-foreground">
                        Status
                        <input
                          value={ticketForm.status}
                          onChange={(e) => setTicketForm((prev) => ({ ...prev, status: e.target.value }))}
                          placeholder="issued, used..."
                          className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                        />
                      </label>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setTicketModalOpen(false)}
                    className="rounded-md border-[3px] border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:brightness-105"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={ticketModalMode === 'create' ? handleCreateTicket : handleUpdateTicket}
                    disabled={ticketActionLoading}
                    className="rounded-md border-[3px] border-border bg-[var(--encore-accent-warm)] px-4 py-2 text-xs font-extrabold text-white [box-shadow:3px_3px_0_var(--border)] hover:-translate-y-0.5 transition-transform disabled:opacity-60"
                  >
                    {ticketModalMode === 'create' ? 'Create' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
