import apiClient from '@/apiClient'
import type { Album, Track } from '@/types/album'

export const getAlbum = (id: string) => apiClient<Album>(`/api/albums/${id}`)
export const getTracksForAlbum = (albumId: string) => apiClient<Track[]>(`/api/albums/${albumId}/tracks`)
