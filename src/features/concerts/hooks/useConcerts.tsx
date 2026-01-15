import { useEffect, useState } from "react"
import apiClient from "@/apiClient"
import type { Concert } from "@/types/concert"

export function useConcerts(enabled: boolean = true) {
    const [concerts, setConcerts] = useState<Concert[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!enabled) return

        const ac = new AbortController()

            ; (async () => {
                try {
                    setLoading(true)
                    setError(null)

                    const json = await apiClient<Concert[]>("/api/concerts", { signal: ac.signal })
                    setConcerts(Array.isArray(json) ? json : [])
                } catch (e: any) {
                    if (e?.name === "AbortError") return
                    setError(e?.message ?? "Failed to load concerts")
                    setConcerts([])
                } finally {
                    setLoading(false)
                }
            })()

        return () => ac.abort()
    }, [enabled])

    return { concerts, loading, error }
}
