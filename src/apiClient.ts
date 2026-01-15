const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
  })

  if (!res.ok) throw new Error(`Request failed: ${res.status}`)

  return (await res.json()) as T
}

export default apiClient
