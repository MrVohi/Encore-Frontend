import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/integrations/auth-context'
import { createCheckoutSession, listUpcomingConcerts, type ConcertForSale } from '@/services/tickets'

export const Route = createFileRoute('/tickets')({
  component: Tickets,
})

function Tickets() {
  const { user } = useAuth()
  const [concerts, setConcerts] = useState<ConcertForSale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    let active = true
    setLoading(true)
    listUpcomingConcerts()
      .then((data) => {
        if (!active) return
        setConcerts(data)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
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
      setMessage('Commande validée. Vous recevrez un email de confirmation.')
      return
    }
    if (query.get('canceled')) {
      setMessage("Commande annulée — vous pouvez réessayer quand vous voulez.")
    }
  }, [])

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: concerts[0]?.currency || 'EUR',
      }),
    [concerts],
  )

  const handleCheckout = async (concertId: string) => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    setBusyId(concertId)
    setError(null)
    try {
      const { url } = await createCheckoutSession({
        concert_id: concertId,
        quantity: 1,
      })
      if (!url) {
        throw new Error('Stripe checkout URL missing')
      }
      window.location.assign(url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Paiment Error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="artists-encore min-h-screen text-foreground flex items-start justify-center overflow-x-hidden">
      <div className="artists-vignette" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 pb-16 space-y-6">
        <section className="rounded-2xl bg-card p-6 shadow-lg border border-border">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tickets</div>
              <h1 className="text-3xl font-bold">Acheter des tickets</h1>
              <p className="text-muted-foreground">
                Réserve tes places en quelques secondes.
              </p>
            </div>
          </div>
        </section>

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
            Chargement des concerts…
          </section>
        )}

        {!loading && concerts.length === 0 && (
          <section className="rounded-2xl bg-card p-6 shadow-md border border-border text-sm text-muted-foreground">
            Aucun concert disponible pour le moment.
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
                    {new Date(concert.when).toLocaleString('fr-FR')} · {concert.city}, {concert.country}
                  </p>
                  <p className="text-sm text-muted-foreground">Lieu: {concert.venue}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-lg font-bold">
                    {formatter.format(concert.price_cents / 100)}
                  </div>
                  <Button
                    onClick={() => handleCheckout(concert.id)}
                    disabled={busyId === concert.id}
                  >
                    {busyId === concert.id ? 'Redirection…' : 'Acheter'}
                  </Button>
                </div>
              </article>
            ))}
          </section>
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
