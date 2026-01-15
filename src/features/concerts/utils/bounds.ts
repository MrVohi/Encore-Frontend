import type { Concert } from '@/types/concert'

export function boundsFromConcerts(concerts: Array<Concert & { lat: number; lng: number }>) {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity

  for (const c of concerts) {
    minLng = Math.min(minLng, c.lng)
    minLat = Math.min(minLat, c.lat)
    maxLng = Math.max(maxLng, c.lng)
    maxLat = Math.max(maxLat, c.lat)
  }

  return [[minLng, minLat], [maxLng, maxLat]] as [[number, number], [number, number]]
}
