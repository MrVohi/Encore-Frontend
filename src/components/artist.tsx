import { useEffect, useState } from "react"
import { type Album, AlbumCard } from "./albums"
import { type Concert, ConcertCard } from "./concerts"

export type Artist = {
  id: string
  name: string
  genre: string
  image_url: string
  preview_url: string
  created_at: string
}

export function ArtistCard({
  artist,
  onClick,
}: {
  artist: Artist
  onClick?: () => void
}) {
  const [imgOk, setImgOk] = useState(true)

  const hasImageUrl = artist.image_url !== "None" && artist.image_url.trim() !== ""
  const showImage = hasImageUrl && imgOk
  const createdDate = new Date(artist.created_at)

  return (
    <div
      className={[
        "text-center bg-white/5 rounded-lg p-4 w-[280px]",
        onClick ? "cursor-pointer hover:bg-white/10 transition" : "",
      ].join(" ")}
      role={onClick ? "button" : undefined}
      onClick={onClick}
    >
      {showImage && (
        <img
          src={artist.image_url}
          alt={artist.name}
          className="mx-auto w-40 h-40 object-cover rounded"
          onError={() => setImgOk(false)}
        />
      )}

      <div className="mt-3 space-y-1">
        <div className="font-semibold text-lg">{artist.name}</div>
        <div className="opacity-70">{artist.genre}</div>
        <div className="text-sm opacity-60">Created: {createdDate.toLocaleString()}</div>
      </div>
    </div>
  )
}

export function ArtistBackCard({
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
  return (
    <div className="text-left bg-white/5 rounded-lg p-4 w-[280px] h-full">
      <div className="font-semibold text-lg">{artist.name}</div>
      <div className="opacity-70">{artist.genre}</div>

      <div className="mt-4 space-y-3 text-sm opacity-80">
        <div className="opacity-60">Albums:</div>

        {albumsLoading && <div className="opacity-60">Loading albums…</div>}
        {albumsError && <div className="text-red-300">Error: {albumsError}</div>}

        {!albumsLoading && !albumsError && (
          <div className="space-y-2 max-h-56 overflow-auto pr-1">
            {albums.length ? (
              albums.map((a) => <AlbumCard key={a.id} album={a} />)
            ) : (
              <div className="opacity-60">No albums</div>
            )}
          </div>
        )}


        <div className="opacity-60">Concerts:</div>
        {concertsLoading && <div className="opacity-60">Loading concerts…</div>}
        {concertsError && <div className="text-red-300">Error: {concertsError}</div>}

        {!concertsLoading && !concertsError && (
          <div className="space-y-2 max-h-56 overflow-auto pr-1">
            {concerts.length ? (
              concerts.map((c) => <ConcertCard key={c.id} concert={c} />)
            ) : (
              <div className="opacity-60">No concerts</div>
            )}
          </div>
        )}
        {/* TODO later: tickets sections */}
      </div>
    </div>
  )
}

async function fetchAlbumsForArtist(artistId: string, signal: AbortSignal): Promise<Album[]> {
  const res = await fetch(`http://localhost:8080/api/artists/${artistId}/albums`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function fetchConcertsForArtist(artistId: string, signal: AbortSignal): Promise<Concert[]> {
  const res = await fetch(`http://localhost:8080/api/artists/${artistId}/concerts`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
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

  const [albums, setAlbums] = useState<Album[]>([])
  const [albumsLoading, setAlbumsLoading] = useState(false)
  const [albumsError, setAlbumsError] = useState<string | null>(null)

  const [concerts, setConcerts] = useState<Concert[]>([])
  const [concertsLoading, setConcertsLoading] = useState(false)
  const [concertsError, setConcertsError] = useState<string | null>(null)

  useEffect(() => {
    if (open) setReturned(false)
  }, [open, artist?.id])

  useEffect(() => {
    if (!open || !artist) return

    const ac = new AbortController()
    setAlbumsLoading(true)
    setAlbumsError(null)
    setAlbums([])

    fetchAlbumsForArtist(artist.id, ac.signal)
      .then((data) => setAlbums(data))
      .catch((e) => {
        if (e?.name === "AbortError") return
        setAlbumsError(e?.message ?? "Failed to load albums")
      })
      .finally(() => setAlbumsLoading(false))

    return () => ac.abort()
  }, [open, artist?.id])

  useEffect(() => {
    if (!open || !artist) return

    const ac = new AbortController()
    setConcertsLoading(true)
    setConcertsError(null)
    setConcerts([])

    fetchConcertsForArtist(artist.id, ac.signal)
      .then((data) => setConcerts(data))
      .catch((e) => {
        if (e?.name === "AbortError") return
        setConcertsError(e?.message ?? "Failed to load concerts")
      })
      .finally(() => setConcertsLoading(false))

    return () => ac.abort()
  }, [open, artist?.id])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  if (!open || !artist) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close" />

      <div className="relative z-10 rounded-xl p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
            onClick={() => setReturned((v) => !v)}
          >
            {returned ? "Show front" : "Show back"}
          </button>

          <button
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mx-auto w-[280px]">
          {returned ? (
            <ArtistBackCard
              artist={artist}
              albums={albums}
              albumsLoading={albumsLoading}
              albumsError={albumsError}
              concerts={concerts}
              concertsLoading={concertsLoading}
              concertsError={concertsError}
            />
          ) : (
            <ArtistCard artist={artist} />
          )}
        </div>
      </div>
    </div>
  )
}
