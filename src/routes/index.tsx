import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { type Artist, ArtistCard } from '../components/artist'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
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
    <div className="pt-25 min-h-screen bg-[#282c34] text-white flex items-start justify-center p-10">
      <div className="mx-auto w-full max-w-5xl">
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