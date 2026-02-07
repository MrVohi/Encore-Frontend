import api from '@/lib/api'

let cachedIds: string[] | null = null

export async function loadFollowedArtistIds(force = false): Promise<string[]> {
  if (cachedIds && !force) return cachedIds
  try {
    const res = await api.get('/follows')
    const ids = Array.isArray(res.data?.artist_ids)
      ? res.data.artist_ids.map(String)
      : []
    cachedIds = ids
    return ids
  } catch {
    cachedIds = []
    return []
  }
}

export function getCachedFollowedArtistIds(): string[] {
  return cachedIds ?? []
}

function emitFollowedChange() {
  window.dispatchEvent(new CustomEvent('followed:change'))
}

export async function followArtist(artistId: string): Promise<void> {
  await api.post('/follows', { artist_id: artistId })
  const next = new Set(getCachedFollowedArtistIds())
  next.add(String(artistId))
  cachedIds = Array.from(next)
  emitFollowedChange()
}

export async function unfollowArtist(artistId: string): Promise<void> {
  await api.delete(`/follows/${artistId}`)
  const next = new Set(getCachedFollowedArtistIds())
  next.delete(String(artistId))
  cachedIds = Array.from(next)
  emitFollowedChange()
}
