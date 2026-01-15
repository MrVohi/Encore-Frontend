import apiClient from '@/apiClient'
import type { Artist } from '@/types/artist'
import type { Album } from '@/types/album'

export const listArtists = (signal?: AbortSignal) => apiClient<Artist[]>('/api/artists', { signal })  
export const getArtist = (id: string) => apiClient<Artist>(`/api/artists/${id}`)
export const getAlbumsForArtist = (artistId: string) => apiClient<Album[]>(`/api/artists/${artistId}/albums`)
