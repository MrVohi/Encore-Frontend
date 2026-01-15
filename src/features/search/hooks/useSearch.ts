import { useEffect, useState } from 'react'
import type { SearchResult } from '@/types/search'
import { searchAll } from '@/services/search'

export default function useSearch(query: string) {
  const [results, setResults] = useState<SearchResult[]>([])

  useEffect(() => {
    const q = String(query ?? '').trim()
    if (q.length < 2) {
      setResults([])
      return
    }

    let mounted = true
    const ac = new AbortController()
    const t = window.setTimeout(async () => {
      try {
        const res = await searchAll(q)
        if (!mounted) return
        setResults(Array.isArray(res) ? res : [])
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        setResults([])
      }
    }, 180)

    return () => {
      mounted = false
      window.clearTimeout(t)
      ac.abort()
    }
  }, [query])

  return results
}
