import type { Artist } from '@/types/artist'

type Listener = (a: Artist | null) => void
const listeners = new Set<Listener>()

export function setSelectedArtist(a: Artist | null) {
  for (const l of listeners) l(a)
}

export function subscribeSelected(cb: Listener) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
