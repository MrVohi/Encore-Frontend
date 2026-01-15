import apiClient from '@/apiClient'
import type { SearchResult } from '@/types/search'

export const searchAll = (q: string) => apiClient<SearchResult[]>(`/api/search?q=${encodeURIComponent(q)}`)
