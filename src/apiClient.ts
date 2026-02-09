const RAW_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '').replace(/\/api\/?$/, '')
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
