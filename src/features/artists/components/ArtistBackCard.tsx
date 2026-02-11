import type { Artist } from "@/types/artist"
import type { Album } from "@/types/album"
import type { Concert } from "@/types/concert"
import { AlbumCard } from "@/features/albums/components/AlbumCard"
import { followArtist, getCachedFollowedArtistIds, loadFollowedArtistIds, unfollowArtist } from '@/lib/following'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/integrations/auth-context'
import { useEffect, useState } from "react"
import { Heart } from 'lucide-react'
import { listTicketTypes } from "@/services/tickets"
import { addCartItem } from "@/services/cart"

function parseWhen(when: string) {
  const d = new Date(String(when).replace(" ", "T"))
  return Number.isNaN(d.getTime()) ? null : d
}

function formatStatus(value?: string | null) {
  if (!value) return "Unknown"
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

function ConcertRow({
  c,
  onBuy,
  buying,
}: {
  c: Concert
  onBuy?: (concertId: string) => void
  buying?: boolean
}) {
  const d = c.when ? parseWhen(c.when) : null

  return (
    <div
      className={[
        "bg-card text-card-foreground",
        "border-[3px] border-border rounded-xl",
        "[box-shadow:3px_3px_0_var(--border)]",
        "p-3",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="font-extrabold leading-tight">
          {c.city} — {c.country}
        </div>

        {/* status pill (optional) */}
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/30">
          {formatStatus(c.status)}
        </span>
      </div>

      <div className="text-xs text-muted-foreground mt-1">
        {d ? d.toLocaleString() : "Unknown date"}
      </div>

      <div className="text-xs text-muted-foreground mt-1">
        Capacity: <span className="text-card-foreground/80">{c.capacity}</span>
      </div>

      {onBuy && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => onBuy(c.id)}
            disabled={buying}
            className={[
              "inline-flex items-center justify-center rounded-full border-[3px] border-border",
              "px-3 py-1 text-xs font-extrabold",
              "[box-shadow:2px_2px_0_var(--border)] transition-transform",
              buying ? "bg-secondary text-muted-foreground" : "bg-[var(--encore-accent-warm)] text-white hover:-translate-y-0.5",
            ].join(" ")}
          >
            {buying ? "Adding…" : "Add to cart"}
          </button>
        </div>
      )}
    </div>
  )
}


export default function ArtistBackCard({
  artist,
  albums,
  albumsLoading,
  albumsError,

  concerts,
  concertsLoading,
  concertsError,
}: {
  artist: Artist
  albums: Album[]
  albumsLoading: boolean
  albumsError: string | null

  concerts: Concert[]
  concertsLoading: boolean
  concertsError: string | null
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [followed, setFollowed] = useState(false)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [buyError, setBuyError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setFollowed(false)
      return
    }
    loadFollowedArtistIds().then((ids) => {
      setFollowed(ids.includes(String(artist.id)))
    })
  }, [artist.id, user])

  const handleFollow = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (!user) {
      navigate({ to: '/login' })
      return
    }
    const currentlyFollowed = getCachedFollowedArtistIds().includes(String(artist.id))
    try {
      if (currentlyFollowed) {
        await unfollowArtist(artist.id)
        setFollowed(false)
      } else {
        await followArtist(artist.id)
        setFollowed(true)
      }
    } catch {
      // keep previous state on error
    }
  }

  const handleAddToCart = async (concertId: string) => {
    if (!user) {
      navigate({ to: "/login" })
      return
    }
    setBuyingId(concertId)
    setBuyError(null)
    try {
      const types = await listTicketTypes(concertId)
      const ticketTypeId = Array.isArray(types) ? types[0]?.id : undefined
      if (!ticketTypeId) throw new Error("No ticket types available")
      await addCartItem({ ticket_type_id: ticketTypeId, quantity: 1 })
      window.dispatchEvent(new Event('cart:changed'))
      window.dispatchEvent(new Event('cart:open'))
    } catch (err: unknown) {
      setBuyError(err instanceof Error ? err.message : "Failed to add to cart")
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <div className="relative w-full h-full bg-card text-card-foreground border-[3px] border-border rounded-xl overflow-hidden [box-shadow:4px_4px_0_var(--border)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b-[3px] border-border flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-extrabold leading-tight">{artist.name}</div>
          <div className="text-sm font-semibold text-muted-foreground">{artist.genre}</div>
        </div>
        <button
          type="button"
          onClick={handleFollow}
          className={[
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shrink-0",
            followed
              ? "border-[color-mix(in_oklab,var(--encore-accent-warm)_60%,var(--border))] bg-[color-mix(in_oklab,var(--encore-accent-warm)_16%,var(--card))] text-foreground"
              : "border-border bg-card text-foreground",
          ].join(" ")}
        >
          <Heart size={14} className={followed ? "fill-[var(--encore-accent-warm)]" : "fill-transparent"} />
          {followed ? "Following" : "Follow"}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Albums */}
        <div>
          <div className="text-sm font-semibold text-muted-foreground mb-2">Albums</div>

          {albumsLoading && <div className="text-sm text-muted-foreground">Loading albums…</div>}
          {albumsError && <div className="text-sm text-red-300">Error: {albumsError}</div>}

          {!albumsLoading && !albumsError && (
            <div className="space-y-2">
              {albums?.length ? (
                albums.map((a) => <AlbumCard key={a.id} album={a} />)
              ) : (
                <div className="text-sm text-muted-foreground">No albums</div>
              )}
            </div>
          )}
        </div>

        {/* Concerts */}
        <div>
          <div className="text-sm font-semibold text-muted-foreground mb-2">Concerts</div>

          {concertsLoading && <div className="text-sm text-muted-foreground">Loading concerts…</div>}
          {concertsError && <div className="text-sm text-red-300">Error: {concertsError}</div>}
          {buyError && <div className="text-sm text-red-300">{buyError}</div>}

          {!concertsLoading && !concertsError && (
            <div className="space-y-2">
              {concerts.length ? (
                concerts.slice(0, 6).map((c) => (
                  <ConcertRow
                    key={c.id}
                    c={c}
                    onBuy={handleAddToCart}
                    buying={buyingId === c.id}
                  />
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No concerts</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
