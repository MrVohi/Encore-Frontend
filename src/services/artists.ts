import apiClient from '@/apiClient'
import type { Artist } from '@/types/artist'
import type { Album } from '@/types/album'

type ListOpts = { name?: string; genre?: string; order?: string }

export const listArtists = (opts?: ListOpts, signal?: AbortSignal) => {
    const params = new URLSearchParams()
    if (opts?.name) params.set('name', opts.name)
    if (opts?.genre) params.set('genre', opts.genre)
    if (opts?.order) params.set('order', opts.order)

    const path = `/api/artists${params.toString() ? `?${params.toString()}` : ''}`
    return apiClient<Artist[]>(path, { signal })
}

export const getArtist = (id: string) => apiClient<Artist>(`/api/artists/${id}`)
export const getAlbumsForArtist = (artistId: string) => apiClient<Album[]>(`/api/artists/${artistId}/albums`)
