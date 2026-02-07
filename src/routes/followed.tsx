import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/integrations/auth-context'
import { type Artist, ArtistCard } from '../components/artist'
import { loadFollowedArtistIds } from '@/lib/following'
import { API_URL } from '@/lib/api'

export const Route = createFileRoute('/followed')({
  component: Followed,
})

function Followed() {
  const { user } = useAuth()
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [followedIds, setFollowedIds] = useState<string[]>([])

  useEffect(() => {
    if (!user) {
      setFollowedIds([])
      return
    }
    loadFollowedArtistIds(true).then(setFollowedIds)
  }, [user])

  useEffect(() => {
    const handler = (event: Event) => {
      if (!user) return
      loadFollowedArtistIds(true).then(setFollowedIds)
    }
    window.addEventListener('followed:change', handler)
    return () => window.removeEventListener('followed:change', handler)
  }, [user])

  useEffect(() => {
    if (!user) {
      setArtists([])
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`${API_URL}/artists`, {
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
  }, [user])

  if (!user) {
    return (
      <div className="pt-25 min-h-screen bg-[#282c34] text-white flex items-start justify-center p-10">
        <div className="mx-auto w-full max-w-5xl space-y-4">
          <h1 className="text-2xl font-bold">Followed artists</h1>
          <p className="text-white/70">Sign in to see your followed artists.</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  const followed = artists.filter((artist) => followedIds.includes(String(artist.id)))

  return (
    <div className="pt-25 min-h-screen bg-[#282c34] text-white flex items-start justify-center p-10">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">Followed artists</h1>

        {loading && <p>Loading…</p>}
        {error && <p className="text-red-300">Error: {error}</p>}

        {!loading && !error && followed.length === 0 && (
          <p className="text-white/70">You are not following any artists yet.</p>
        )}

        {!loading && !error && followed.length > 0 && (
          <div className="flex flex-wrap gap-6">
            {followed.map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
