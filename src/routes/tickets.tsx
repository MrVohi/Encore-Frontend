import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/integrations/auth-context'
import {
  listUpcomingConcerts,
  listTicketTypes,
  listUserTickets,
  type ConcertForSale,
  type TicketType,
  type UserTicket,
} from '@/services/tickets'
import { addCartItem } from '@/services/cart'

export const Route = createFileRoute('/tickets')({
  component: Tickets,
})

function Tickets() {
  const { user } = useAuth()
  const [concerts, setConcerts] = useState<ConcertForSale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('')
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [ticketsError, setTicketsError] = useState<string | null>(null)
  const [activeTickets, setActiveTickets] = useState<UserTicket[]>([])
  const [pastTickets, setPastTickets] = useState<UserTicket[]>([])
  const [tab, setTab] = useState<'buy' | 'mine'>('buy')
  const [cartBusyId, setCartBusyId] = useState<string | null>(null)
  const [cartNotice, setCartNotice] = useState<string | null>(null)
  const [ticketTypes, setTicketTypes] = useState<Record<string, TicketType[]>>({})

  useEffect(() => {
    let active = true
    setLoading(true)
    listUpcomingConcerts()
      .then((data) => {
        if (!active) return
        if (Array.isArray(data)) {
          setConcerts(data)
          setError(null)
        } else {
          setConcerts([])
          setError('Failed to load concerts')
        }
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load concerts')
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    if (query.get('success')) {
      setMessage('Order confirmed. You will receive a confirmation email.')
      return
    }
    if (query.get('canceled')) {
      setMessage('Order canceled — you can try again anytime.')
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setActiveTickets([])
      setPastTickets([])
      return
    }
    let active = true
    setTicketsLoading(true)
    setTicketsError(null)
    listUserTickets()
      .then((data) => {
        if (!active) return
        setActiveTickets(Array.isArray(data?.active) ? data.active : [])
        setPastTickets(Array.isArray(data?.past) ? data.past : [])
      })
      .catch((err: unknown) => {
        if (!active) return
        setTicketsError(err instanceof Error ? err.message : 'Failed to load tickets')
      })
      .finally(() => {
        if (!active) return
        setTicketsLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: concerts[0]?.currency || 'EUR',
      }),
    [concerts],
  )

  const ensureTicketTypes = async (concertId: string) => {
    if (ticketTypes[concertId]) return ticketTypes[concertId]
    const list = await listTicketTypes(concertId)
    const safe = Array.isArray(list) ? list : []
    setTicketTypes((prev) => ({ ...prev, [concertId]: safe }))
    return safe
  }

  const handleAddToCart = async (concertId: string) => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    setCartBusyId(concertId)
    setCartNotice(null)
    try {
      const types = await ensureTicketTypes(concertId)
      const ticketTypeId = types[0]?.id
      if (!ticketTypeId) throw new Error('No ticket types available')
      await addCartItem({ ticket_type_id: ticketTypeId, quantity: 1 })
      window.dispatchEvent(new Event('cart:changed'))
      window.dispatchEvent(new Event('cart:open'))
      setCartNotice('Added to cart.')
    } catch (err: unknown) {
      setCartNotice(err instanceof Error ? err.message : 'Failed to add to cart')
    } finally {
      setCartBusyId(null)
    }
  }

  const formatStatus = (value?: string | null) => {
    if (!value) return 'Unknown'
    return String(value)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase())
  }

  return (
    <div className="artists-encore min-h-screen text-foreground flex items-start justify-center overflow-x-hidden">
      <div className="artists-vignette" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 pb-16 space-y-6">
        <section className="rounded-2xl bg-card p-6 shadow-lg border border-border">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tickets</div>
              <h1 className="text-3xl font-bold">Buy tickets</h1>
              <p className="text-muted-foreground">
                Reserve your seats in seconds.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-md border border-border">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Tickets
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTab('buy')}
                className={[
                  "rounded-full border-[3px] border-border px-4 py-1.5 text-xs font-extrabold",
                  "[box-shadow:3px_3px_0_var(--border)] transition-transform",
                  tab === 'buy'
                    ? "bg-[var(--encore-accent-warm)] text-white"
                    : "bg-secondary text-foreground hover:-translate-y-0.5",
                ].join(" ")}
              >
                Buy tickets
              </button>
              <button
                type="button"
                onClick={() => setTab('mine')}
                className={[
                  "rounded-full border-[3px] border-border px-4 py-1.5 text-xs font-extrabold",
                  "[box-shadow:3px_3px_0_var(--border)] transition-transform",
                  tab === 'mine'
                    ? "bg-[var(--encore-accent-warm)] text-white"
                    : "bg-secondary text-foreground hover:-translate-y-0.5",
                ].join(" ")}
              >
                My tickets
              </button>
            </div>
          </div>
        </section>

        {tab === 'mine' && user && (
          <section className="rounded-2xl bg-card p-6 shadow-md border border-border space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Your tickets</h2>
              <p className="text-sm text-muted-foreground">
                Active tickets are valid for upcoming shows.
              </p>
            </div>

            {ticketsLoading && (
              <div className="text-sm text-muted-foreground">Loading tickets…</div>
            )}
            {ticketsError && (
              <div className="text-sm text-red-400">Error: {ticketsError}</div>
            )}

            {!ticketsLoading && !ticketsError && (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border-[3px] border-border bg-secondary p-4 [box-shadow:3px_3px_0_var(--border)]">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    Active
                  </div>
                  <div className="mt-3 space-y-2">
                    {activeTickets.length ? (
                      activeTickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="rounded-lg border-[3px] border-border bg-card px-4 py-3 [box-shadow:3px_3px_0_var(--border)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-foreground">
                                {ticket.artist}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(ticket.when).toLocaleString('en-US')} · {ticket.city}, {ticket.country}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Seat: {ticket.seat || 'GA'}
                              </div>
                            </div>
                            <span className="rounded-full border border-border bg-[var(--encore-accent-warm)] px-2 py-0.5 text-[10px] font-semibold text-white">
                              {formatStatus(ticket.status)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">No active tickets.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border-[3px] border-border bg-secondary p-4 [box-shadow:3px_3px_0_var(--border)]">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    Past
                  </div>
                  <div className="mt-3 space-y-2">
                    {pastTickets.length ? (
                      pastTickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="rounded-lg border-[3px] border-border bg-card px-4 py-3 [box-shadow:3px_3px_0_var(--border)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-foreground">
                                {ticket.artist}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(ticket.when).toLocaleString('en-US')} · {ticket.city}, {ticket.country}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Seat: {ticket.seat || 'GA'}
                              </div>
                            </div>
                            <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {formatStatus(ticket.status)}
                            </span>
                          </div>
                          {ticket.used_at && (
                            <div className="mt-2 text-[11px] text-muted-foreground">
                              Used: {new Date(ticket.used_at).toLocaleString('en-US')}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">No past tickets.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === 'buy' && (
          <>
            {cartNotice && (
              <section className="rounded-2xl bg-card p-4 shadow-md border border-border text-sm text-muted-foreground">
                {cartNotice}
              </section>
            )}

            {error && (
              <section className="rounded-2xl bg-card p-4 shadow-md border border-border text-sm text-red-400">
                {error}
              </section>
            )}

            {message && (
              <section className="rounded-2xl bg-card p-4 shadow-md border border-border text-sm text-muted-foreground">
                {message}
              </section>
            )}

            {loading && (
              <section className="rounded-2xl bg-card p-6 shadow-md border border-border text-sm text-muted-foreground">
                Loading concerts…
              </section>
            )}

            {!loading && concerts.length === 0 && (
              <section className="rounded-2xl bg-card p-6 shadow-md border border-border text-sm text-muted-foreground">
                No concerts available at the moment.
              </section>
            )}

            {!loading && concerts.length > 0 && (
              <section className="grid gap-4">
                {concerts.map((concert) => (
                  <article
                    key={concert.id}
                    className="rounded-2xl bg-card p-6 shadow-md border border-border flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <h2 className="text-lg font-bold">{concert.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {new Date(concert.when).toLocaleString('en-US')} · {concert.city}, {concert.country}
                      </p>
                      <p className="text-sm text-muted-foreground">Venue: {concert.venue}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold">
                        {formatter.format(concert.price_cents / 100)}
                      </div>
                      <Button
                        onClick={() => handleAddToCart(concert.id)}
                        disabled={cartBusyId === concert.id}
                      >
                        {cartBusyId === concert.id ? 'Adding…' : 'Add to cart'}
                      </Button>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}




// import { createFileRoute } from '@tanstack/react-router'

// export const Route = createFileRoute('/tickets')({
//   component: Tickets,
// })

// function Tickets() {
//   return (
//     <div className="artists-encore min-h-screen text-foreground flex items-start justify-center overflow-x-hidden">
//       <div className="artists-vignette" aria-hidden="true" />
//       <div className="relative z-10 w-full max-w-5xl mx-auto px-4 pb-16 space-y-6">
//         <section className="rounded-2xl bg-card p-6 shadow-lg border border-border">
//           <div className="flex flex-wrap items-start justify-between gap-4">
//             <div className="max-w-2xl">
//               <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Plans</div>
//               <h1 className="text-3xl font-bold">Tickets</h1>
//               <p className="text-muted-foreground">
//                 Track your upcoming shows, past events, and saved ticket links.
//               </p>
//             </div>
//             <span className="inline-flex items-center gap-2 rounded-full border border-[var(--encore-primary)] bg-[var(--encore-bg-cream)] px-3 py-1 text-xs text-[var(--encore-text-dark)]">
//               Coming soon
//             </span>
//           </div>
//         </section>

//         <section className="rounded-2xl bg-card p-6 shadow-md border border-border text-sm text-muted-foreground">
//           You do not have any tickets yet.
//         </section>
//       </div>
//     </div>
//   )
// }
