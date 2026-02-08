import { useEffect, useMemo, useState } from 'react'
import { Heart } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/integrations/auth-context'
import { followArtist, getCachedFollowedArtistIds, loadFollowedArtistIds, unfollowArtist } from '@/lib/following'
import type { Artist } from '@/types/artist'
import { isValidHttpUrl } from '../utils/url'

export default function ArtistCard({
  artist,
  index = 0,
  onClick,
  variant = "card",
  albumPreview,
}: {
  artist: Artist
  index?: number
  onClick?: () => void
  variant?: "card" | "record"
  albumPreview?: string[]
}) {
  const imageUrl = String(artist.artwork_url ?? artist.image_url ?? '')
  const src = isValidHttpUrl(imageUrl) ? imageUrl.trim() : ''
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgOk, setImgOk] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [followed, setFollowed] = useState(false)

  useEffect(() => {
    setImgLoaded(false)
    setImgOk(true)
  }, [src])

  useEffect(() => {
    if (!user) {
      setFollowed(false)
      return
    }
    loadFollowedArtistIds().then((ids) => {
      setFollowed(ids.includes(String(artist.id)))
    })
  }, [artist.id, user])

  const hasImageUrl = imageUrl !== 'None' && imageUrl.trim() !== ''
  const showImage = !!src && hasImageUrl && imgOk

  const gradient = useMemo(() => {
    const gradients = [
      'linear-gradient(135deg, var(--encore-accent-cool, #3d5a80) 0%, var(--encore-accent-warm, #e07a5f) 100%)',
      'linear-gradient(135deg, var(--encore-accent-warm, #e07a5f) 0%, var(--encore-accent-light, #f4a261) 100%)',
      'linear-gradient(135deg, #81b29a 0%, var(--encore-accent-cool, #3d5a80) 100%)',
    ]
    return gradients[index % gradients.length]
  }, [index])

  const interactive = !!onClick

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

  if (variant === "record") {
    return (
      <div
        className={[
          "artist-record",
          interactive ? "cursor-pointer" : "",
        ].join(" ")}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(e) => {
          if (!interactive) return
          if (e.key === "Enter" || e.key === " ") onClick?.()
        }}
      >
        <div className="artist-record-cover">
          <div
            className="artist-record-cover-bg"
            style={{ backgroundImage: gradient, backgroundSize: "cover" }}
          />

          {showImage && (
            <img
              src={src}
              alt=""
              className={[
                "artist-record-img",
                imgLoaded ? "opacity-100" : "opacity-0",
              ].join(" ")}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgOk(false)}
              loading="lazy"
              decoding="async"
            />
          )}
        </div>

        <div className="artist-record-meta">
          <div className="artist-record-row">
            <div className="artist-record-name">{artist.name}</div>
            <div className="artist-record-genre">{artist.genre}</div>
          </div>
          {albumPreview && albumPreview.length > 0 ? (
            <div className="artist-record-albums">{albumPreview.slice(0, 2).join(" • ")}</div>
          ) : (
            <div className="artist-record-albums artist-record-albums-empty">No albums yet</div>
          )}
        </div>

        <button
          type="button"
          onClick={handleFollow}
          className={[
            "artist-follow-btn",
            followed ? "is-followed" : "",
          ].join(" ")}
          aria-label={followed ? "Unfollow artist" : "Follow artist"}
        >
          <Heart size={14} className={followed ? "fill-current" : ""} />
          <span>{followed ? "Following" : "Follow"}</span>
        </button>

        <div className="artist-record-vinyl" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div
      className={[
        'bg-card text-card-foreground',
        'border-[3px] border-border rounded-xl overflow-hidden',
        'transition-all duration-300',
        interactive ? 'cursor-pointer hover:-translate-y-2' : '',
        interactive
          ? '[box-shadow:4px_4px_0_var(--border)] hover:[box-shadow:6px_6px_0_var(--border)]'
          : '[box-shadow:4px_4px_0_var(--border)]',
      ].join(' ')}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!interactive) return
        if (e.key === 'Enter' || e.key === ' ') onClick?.()
      }}
    >
      <div className="relative w-full aspect-square">
        <div className="absolute inset-0" style={{ backgroundImage: gradient, backgroundSize: 'cover' }} />
        <div className="absolute inset-0 flex items-center justify-center select-none">
          <span className="text-[5rem] leading-none text-white/20 -rotate-12">♪</span>
        </div>

        {showImage && (
          <img
            src={src}
            alt=""
            className={[
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-200',
              imgLoaded ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgOk(false)}
            loading="lazy"
            decoding="async"
          />
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute bottom-3 left-3 right-3 z-10" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.55)' }}>
          <div className="text-lg font-extrabold text-white leading-tight">{artist.name}</div>
          <div className="text-sm font-semibold text-white/85">{artist.genre}</div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Follow</div>
        <button
          type="button"
          onClick={handleFollow}
          className={[
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
            followed
              ? "border-[color-mix(in_oklab,var(--encore-accent-warm)_60%,var(--border))] bg-[color-mix(in_oklab,var(--encore-accent-warm)_16%,var(--card))] text-foreground"
              : "border-border bg-card text-foreground",
          ].join(" ")}
        >
          <Heart size={14} className={followed ? "fill-[var(--encore-accent-warm)]" : "fill-transparent"} />
          {followed ? "Following" : "Follow"}
        </button>
      </div>
    </div>
  )
}
