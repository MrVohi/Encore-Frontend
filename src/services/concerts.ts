import apiClient from "@/apiClient"
import type { Concert } from "@/types/concert"

export const listConcertsForArtist = (artistId: string, signal?: AbortSignal) =>
    apiClient<Concert[]>(`/api/artists/${artistId}/concerts`, signal ? { signal } : undefined)
