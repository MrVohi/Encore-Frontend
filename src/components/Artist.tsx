import { useEffect, useMemo, useState } from "react"

import type { Album } from "./Album"
import { AlbumCard } from "./Album"
import { VinylDisc } from "./ui/vinyl"

export type Artist = {
  id: string
  name: string
  genre: string
  image_url: string
  preview_url: string
  created_at: string
}

type ArtistCardProps = {
  artist: Artist
  index?: number
  onClick?: () => void
  showCreated?: boolean
}

function isValidHttpUrl(v: unknown) {
  const s = String(v ?? "").trim()
  if (!s) return false
  if (s === "None" || s === "null" || s === "undefined") return false
  return /^https?:\/\//i.test(s)
}

export function ArtistCard({
  artist,
  index = 0,
  onClick,
}: ArtistCardProps) {
  const src = isValidHttpUrl(artist.image_url) ? artist.image_url.trim() : ""
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgOk, setImgOk] = useState(true)

  useEffect(() => {
    // reset when artist changes
    setImgLoaded(false)
    setImgOk(true)
  }, [src])

  const hasImageUrl = artist.image_url !== "None" && artist.image_url.trim() !== ""
  const showImage = !!src && hasImageUrl && imgOk

  const gradient = useMemo(() => {
    const gradients = [
      "linear-gradient(135deg, var(--encore-accent-cool, #3d5a80) 0%, var(--encore-accent-warm, #e07a5f) 100%)",
      "linear-gradient(135deg, var(--encore-accent-warm, #e07a5f) 0%, var(--encore-accent-light, #f4a261) 100%)",
      "linear-gradient(135deg, #81b29a 0%, var(--encore-accent-cool, #3d5a80) 100%)",
    ]
    return gradients[index % gradients.length]
  }, [index])

  const interactive = !!onClick

  return (
    <div
      className={[
        "bg-card text-card-foreground",
        "border-[3px] border-border rounded-xl overflow-hidden",
        "transition-all duration-300",
        interactive ? "cursor-pointer hover:-translate-y-2" : "",
        interactive
          ? "[box-shadow:4px_4px_0_var(--border)] hover:[box-shadow:6px_6px_0_var(--border)]"
          : "[box-shadow:4px_4px_0_var(--border)]",
      ].join(" ")}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!interactive) return
        if (e.key === "Enter" || e.key === " ") onClick?.()
      }}
    >

      {/* Sleeve cover (square vinyl feel) */}
      <div className="relative w-full aspect-square">
        <div className="absolute inset-0" style={{ backgroundImage: gradient, backgroundSize: "cover" }} />

        {/* placeholder is always there */}
        <div className="absolute inset-0 flex items-center justify-center select-none">
          <span className="text-[5rem] leading-none text-white/20 -rotate-12">♪</span>
        </div>

        {/* real image only if URL looks valid; fade in after load; no alt flash */}
        {showImage && (
          <img
            src={src}
            alt=""                 // <-- prevents alt text being drawn in the box
            className={[
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-200",
              imgLoaded ? "opacity-100" : "opacity-0",
            ].join(" ")}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgOk(false)}
            loading="lazy"
            decoding="async"
          />
        )}


        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />


        <div className="absolute bottom-3 left-3 right-3 z-10" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.55)" }}>
          <div className="text-lg font-extrabold text-white leading-tight">{artist.name}</div>
          <div className="text-sm font-semibold text-white/85">{artist.genre}</div>
        </div>

        {!showImage && (
          <div className="absolute inset-0 flex items-center justify-center select-none">
            <span className="text-[5rem] leading-none text-white/0 -rotate-12">♪</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function ArtistBackCard({
  artist,
  albums,
  albumsLoading,
  albumsError,
}: {
  artist: Artist
  albums: Album[]
  albumsLoading: boolean
  albumsError: string | null
}) {

  return (
    <div className="relative w-full h-full overflow-visible">

      {/* Sleeve (single div) with a circular notch cut on the right */}
      <div
        className={[
          "relative z-10 w-full h-full",
          "bg-card text-card-foreground",
          "border-[3px] border-border rounded-xl overflow-hidden",
          "[box-shadow:4px_4px_0_var(--border)]",
          "flex flex-col",
        ].join(" ")}

      >
        {/* Header */}
        <div className="p-4 border-b-[3px] border-border">
          <div className="text-lg font-extrabold leading-tight">{artist.name}</div>
          <div className="text-sm font-semibold text-muted-foreground">{artist.genre}</div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
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
        </div>
      </div>
    </div>
  )
}

async function fetchAlbumsForArtist(artistId: string, signal: AbortSignal): Promise<Album[]> {
  const res = await fetch(`http://localhost:8080/api/artists/${artistId}/albums`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status} while fetching albums`)

  const json = await res.json()
  const albums: Album[] = Array.isArray(json) ? json : [] // null -> []

  const albumsWithTracks = await Promise.all(
    albums.map(async (a) => {
      const tr = await fetch(`http://localhost:8080/api/albums/${a.id}/tracks`, { signal })
      if (!tr.ok) throw new Error(`HTTP ${tr.status} while fetching tracks for album ${a.id}`)
      const tjson = await tr.json()
      const tracks = Array.isArray(tjson) ? tjson : [] // null -> []
      return { ...a, tracks }
    }),
  )

  return albumsWithTracks
}

export function ArtistPopup({
  artist,
  open,
  onClose,
}: {
  artist: Artist | null
  open: boolean
  onClose: () => void
}) {
  const [returned, setReturned] = useState(false)
  const [vinylOut, setVinylOut] = useState(false)

  const [albums, setAlbums] = useState<Album[]>([])
  const [albumsLoading, setAlbumsLoading] = useState(false)
  const [albumsError, setAlbumsError] = useState<string | null>(null)

  // ✅ for open/close animation
  const [mounted, setMounted] = useState(false)
  const [show, setShow] = useState(false)
  const [renderArtist, setRenderArtist] = useState<Artist | null>(null)

  const showVinyl = albums.length > 0

  // Keep last artist around during exit so we can animate close
  useEffect(() => {
    if (open && artist) setRenderArtist(artist)
  }, [open, artist])

  // Mount/unmount with transitions
  useEffect(() => {
    if (open && artist) {
      setMounted(true)
      setReturned(false)
      setVinylOut(false)

      // next frame so CSS transition triggers
      requestAnimationFrame(() => setShow(true))
      return
    }

    // start exit animation
    setShow(false)

    // after animation ends, unmount + clear render snapshot
    const t = setTimeout(() => {
      setMounted(false)
      setRenderArtist(null)
    }, 200)

    return () => clearTimeout(t)
  }, [open, artist])

  // Escape closes (parent will flip open=false / artist=null, we animate anyway)
  useEffect(() => {
    if (!mounted) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [mounted, onClose])

  // Load albums when opened (using renderArtist so it still exists)
  useEffect(() => {
    if (!open || !renderArtist) return

    const ac = new AbortController()
    setAlbumsLoading(true)
    setAlbumsError(null)
    setAlbums([])

    fetchAlbumsForArtist(renderArtist.id, ac.signal)
      .then((a) => setAlbums(Array.isArray(a) ? a : []))
      .catch((e) => {
        if (e?.name === "AbortError") return
        setAlbumsError(e?.message ?? "Failed to load albums")
        setAlbums([])
      })
      .finally(() => setAlbumsLoading(false))

    return () => ac.abort()
  }, [open, renderArtist?.id])

  if (!mounted || !renderArtist) return null

  const tab =
    "bg-secondary text-foreground border-[3px] border-border px-3 py-1.5 text-sm font-extrabold " +
    "[box-shadow:3px_3px_0_var(--border)] hover:-translate-y-0.5 transition-transform"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop animates IN/OUT */}
      <button
        className={[
          "absolute inset-0 bg-black/60 transition-opacity duration-200 ease-out",
          show ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onClick={onClose}
        aria-label="Close"
      />

      {/* Card animates IN/OUT */}
      <div
        className={[
          "relative z-10 transition-all duration-200 ease-out",
          show ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-[0.98]",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-[min(92vw,420px)] aspect-square">
          {/* Tabs */}
          <button
            className={`${tab} absolute -top-5 left-5 rounded-b-md rounded-t-md -rotate-1`}
            onClick={() => {
              setVinylOut(false)
              setReturned((v) => !v)
            }}
          >
            {returned ? "FRONT" : "BACK"}
          </button>

          <button
            className={`${tab} absolute -top-5 right-5 rounded-b-md rounded-t-md rotate-1`}
            onClick={onClose}
          >
            CLOSE
          </button>

          <div className="h-full w-full pt-3">
            <div className="relative w-full h-full overflow-visible">
              {/* Vinyl only on BACK */}
              {showVinyl && (
                <VinylDisc
                  visible={returned}
                  out={returned ? vinylOut : false}
                  onToggle={() => setVinylOut((v) => !v)}
                  fadeInDelayMs={140}
                />
              )}

              {/* BACK layer */}
              <div
                className={[
                  "absolute inset-0 z-10",
                  returned ? "pointer-events-auto" : "pointer-events-none",
                ].join(" ")}
              >
                <ArtistBackCard
                  artist={renderArtist}
                  albums={albums}
                  albumsLoading={albumsLoading}
                  albumsError={albumsError}
                />
              </div>

              {/* FRONT layer (delay only when coming BACK -> FRONT) */}
              <div
                className={[
                  "absolute inset-0 z-20 transition-opacity ease-out duration-200",
                  returned ? "opacity-0 pointer-events-none" : "opacity-100",
                ].join(" ")}
                style={{
                  transitionDelay: returned ? "0ms" : "180ms",
                }}
              >
                <ArtistCard artist={renderArtist} index={0} showCreated={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

