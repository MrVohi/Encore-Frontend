export function getFollowedArtistIds(userId?: string | null): string[] {
  if (!userId) return []
  try {
    const raw = localStorage.getItem(`encore.followed.${userId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

export function setFollowedArtistIds(userId: string, ids: string[]): void {
  localStorage.setItem(`encore.followed.${userId}`, JSON.stringify(ids))
}

export function isArtistFollowed(userId: string | null | undefined, artistId: string): boolean {
  if (!userId) return false
  return getFollowedArtistIds(userId).includes(String(artistId))
}

export function toggleArtistFollow(userId: string, artistId: string): boolean {
  const ids = new Set(getFollowedArtistIds(userId))
  const key = String(artistId)
  if (ids.has(key)) {
    ids.delete(key)
    setFollowedArtistIds(userId, Array.from(ids))
    window.dispatchEvent(new CustomEvent('followed:change', { detail: { userId } }))
    return false
  }
  ids.add(key)
  setFollowedArtistIds(userId, Array.from(ids))
  window.dispatchEvent(new CustomEvent('followed:change', { detail: { userId } }))
  return true
}
