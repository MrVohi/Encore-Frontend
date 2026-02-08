import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/integrations/auth-context'
import type { Artist } from '@/types/artist'
import ArtistCard from '@/features/artists/components/ArtistCard'
import { loadFollowedArtistIds } from '@/lib/following'
import { listArtists } from '@/services/artists'

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
    const handler = () => {
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

        const json = await listArtists(undefined, controller.signal)
        if (!Array.isArray(json)) throw new Error('Unexpected response (not an array)')
        const nextArtists: Artist[] = json
        setArtists(nextArtists)
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
      <div className="artists-encore min-h-screen text-foreground flex items-start justify-center overflow-x-hidden">
        <div className="artists-vignette" aria-hidden="true" />
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 pb-16">
          <div className="panel shelf">
            <div className="shelfhead">
              <div className="label">Followed artists</div>
              <div className="label">Sign in</div>
            </div>
            <div className="px-4 pb-4 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-3">
              <span>Sign in to see the artists you follow.</span>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:brightness-105"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const followed = useMemo(
    () => artists.filter((artist) => followedIds.includes(String(artist.id))),
    [artists, followedIds],
  )

  return (
    <div className="artists-encore min-h-screen text-foreground flex items-start justify-center overflow-x-hidden">
      <div className="artists-vignette" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 pb-14">
        <div className="pagehead mt-3">
          <div className="max-w-2xl">
            <div className="kicker">library</div>
            <h1 className="h1">Followed artists</h1>
            <p className="subline">Quick access to the artists you care about.</p>
          </div>
        </div>

        {loading && <p>Loading…</p>}
        {error && <p className="text-red-300">Error: {error}</p>}

        {!loading && !error && followed.length === 0 && (
          <div className="panel shelf">
            <div className="shelfhead">
              <div className="label">Followed</div>
              <div className="label">0 artists</div>
            </div>
            <div className="px-4 pb-4 text-sm text-muted-foreground">
              You are not following any artists yet.
            </div>
          </div>
        )}

        {!loading && !error && followed.length > 0 && (
          <div className="panel shelf">
            <div className="shelfhead">
              <div className="label">Followed</div>
              <div className="label">{followed.length} artists</div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-2 pb-4">
              {followed.map((a, i) => (
                <div key={a.id} className="px-2">
                  <ArtistCard artist={a} index={i} variant="record" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
