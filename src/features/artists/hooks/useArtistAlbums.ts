import { useEffect, useState } from 'react'
import { getAlbumsForArtist } from '@/services/artists'
import { getTracksForAlbum } from '@/services/albums'
import type { Album, Track } from '@/types/album'

export default function useArtistAlbums(artistId: string | null) {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!artistId) return
    const ac = new AbortController()
    setLoading(true)
    setError(null)

    getAlbumsForArtist(artistId)
      .then(async (a) => {
        if (!Array.isArray(a)) return setAlbums([])
        const withTracks = await Promise.all(
          a.map(async (al) => ({
            ...al,
            tracks: await getTracksForAlbum(al.id).catch(() => []) as Track[],
          })),
        )
        setAlbums(withTracks)
      })
      .catch((e) => {
        if (e?.name === 'AbortError') return
        setError(e?.message ?? 'Failed to load albums')
        setAlbums([])
      })
      .finally(() => setLoading(false))

    return () => ac.abort()
  }, [artistId])

  return { albums, loading, error }
}
