import { useEffect, useState } from "react"
import apiClient from "@/apiClient"
import type { Concert } from "@/types/concert"

export default function useArtistConcerts(artistId: string | null, enabled: boolean) {
    const [concerts, setConcerts] = useState<Concert[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!enabled || !artistId) {
            setConcerts([])
            setLoading(false)
            setError(null)
            return
        }

        const ac = new AbortController()

            ; (async () => {
                try {
                    setLoading(true)
                    setError(null)

                    const json = await apiClient<unknown>(`/api/artists/${artistId}/concerts`, {
                        signal: ac.signal,
                    })

                    // backend might return null -> []
                    setConcerts(Array.isArray(json) ? (json as Concert[]) : [])
                } catch (e: any) {
                    if (e?.name === "AbortError") return
                    setError(e?.message ?? "Failed to load concerts")
                    setConcerts([])
                } finally {
                    setLoading(false)
                }
            })()

        return () => ac.abort()
    }, [artistId, enabled])

    return { concerts, loading, error }
}
