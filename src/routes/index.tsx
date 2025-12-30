import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/')({
  component: App,
})

export type Artist = {
  id: string
  name: string
  genre: string
  image_url: string
  preview_url: string
  created_at: string 
}

function ArtistCard({ artist }: { artist: Artist }) {
  const [imgOk, setImgOk] = useState(true)

  const hasImageUrl =
    artist.image_url !== 'None' && artist.image_url.trim() !== ''

  const showImage = hasImageUrl && imgOk
  const createdDate = new Date(artist.created_at)

  return (
    <div className="text-center bg-white/5 rounded-lg p-4 w-[280px]">
      {showImage && (
        <img
          src={artist.image_url}
          alt={artist.name}
          className="mx-auto w-40 h-40 object-cover rounded"
          onError={() => setImgOk(false)} // hide image if URL is broken
        />
      )}

      <div className="mt-3 space-y-1">
        <div className="font-semibold text-lg">{artist.name}</div>
        <div className="opacity-70">{artist.genre}</div>
        <div className="text-sm opacity-60">
          Created: {createdDate.toLocaleString()}
        </div>
      </div>
    </div>
  )
}

function App() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch('http://localhost:8080/api/artists', {
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json()

        if (!Array.isArray(json)) throw new Error('Unexpected response (not an array)')

        setArtists(json as Artist[])
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setArtists([])
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [])

  return (
    <div className="min-h-screen bg-[#282c34] text-white flex items-start justify-center p-10">
      <div className="w-full max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">Artists</h1>

        {loading && <p>Loading…</p>}
        {error && <p className="text-red-300">Error: {error}</p>}

        {!loading && !error && (
          <div className="flex flex-wrap gap-6">
            {artists.map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
