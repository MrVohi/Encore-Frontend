import { useCallback, useMemo, useState, useEffect } from "react"
import type { ArtistFilters } from "./types"
import { defaultArtistFilters } from "./types"


type Options = { syncToUrl?: boolean }


function toOrderParam(order: string | null | undefined) {
    switch (order) {
        case "created_at_asc":
        case "created_at_desc":
        case "name_asc":
        case "name_desc":
            return order
        default:
            return defaultArtistFilters.order
    }
}


function readFiltersFromSearch(search: string): ArtistFilters {
    const params = new URLSearchParams(search)
    const name = params.get("name") ?? defaultArtistFilters.name
    const genre = (params.get("genre") as string) ?? defaultArtistFilters.genre
    const order = toOrderParam(params.get("order"))
    return { name, genre, order }
}


export default function useArtistFilters() {

    const [filters, setFiltersState] = useState<ArtistFilters>(defaultArtistFilters)

    const setFilters = useCallback((next: Partial<ArtistFilters>) => {
        setFiltersState((p) => ({ ...p, ...next }))
    }, [])

    const resetFilters = useCallback(() => {
        setFiltersState(defaultArtistFilters)
    }, [])

    return useMemo(() => ({ filters, setFilters, resetFilters }), [filters, setFilters, resetFilters])
}