import type { Artist } from "@/types/artist"
import type { Album } from "@/types/album"
import type { Concert } from "@/types/concert"
import { AlbumCard } from "@/features/albums/components/AlbumCard"
import { followArtist, getCachedFollowedArtistIds, loadFollowedArtistIds, unfollowArtist } from '@/lib/following'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/integrations/auth-context'
import { useEffect, useState } from "react"
import { Heart } from 'lucide-react'

function parseWhen(when: string) {
  const d = new Date(String(when).replace(" ", "T"))
  return Number.isNaN(d.getTime()) ? null : d
}

function ConcertRow({ c }: { c: Concert }) {
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
          {c.status}
        </span>
      </div>

      <div className="text-xs text-muted-foreground mt-1">
        {d ? d.toLocaleString() : "Unknown date"}
      </div>

      <div className="text-xs text-muted-foreground mt-1">
        Capacity: <span className="text-card-foreground/80">{c.capacity}</span>
      </div>
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

          {!concertsLoading && !concertsError && (
            <div className="space-y-2">
              {concerts.length ? (
                concerts.slice(0, 6).map((c) => <ConcertRow key={c.id} c={c} />)
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
