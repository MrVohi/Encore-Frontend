import "maplibre-gl/dist/maplibre-gl.css"

import { useEffect, useMemo, useRef, useState } from "react"
import Map, { Marker, Popup, type MapRef } from "react-map-gl/maplibre"

import type { Concert } from "@/types/concert"
import { hasCoords } from "@/types/concert"

import { useConcerts } from "@/features/concerts/hooks/useConcerts"
import ConcertCard from "@/features/concerts/components/ConcertCard"
import { boundsFromConcerts } from "@/features/concerts/utils/bounds"
import { parseWhen } from "@/features/concerts/utils/date"
import { listArtists } from "@/services/artists"
import { getCachedFollowedArtistIds, loadFollowedArtistIds } from "@/lib/following"

import "@/features/concerts/styles/map.css"


function EncoreMarker({ active }: { active: boolean }) {
    return (
        <div
            className={[
                "relative grid place-items-center",
                "h-5 w-5 rounded-full",
                "border-[3px] border-border",
                "[box-shadow:2px_2px_0_var(--border)]",
                "transition-transform",
                active ? "scale-110" : "hover:scale-110",
            ].join(" ")}
            style={{ background: "var(--encore-accent-warm)" }}
        >
            <div className="h-1.5 w-1.5 rounded-full bg-black/60" />
            <div className="absolute inset-[-10px] rounded-full" />
        </div>
    )
}

export default function ConcertMap() {
    const { concerts, loading, error } = useConcerts(true)
    const [selected, setSelected] = useState<Concert | null>(null)
    const [statusFilter, setStatusFilter] = useState("all")
    const [artistFilter, setArtistFilter] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")
    const [artistCatalog, setArtistCatalog] = useState<Record<string, string>>({})
    const [followedOnly, setFollowedOnly] = useState(false)
    const [followedIds, setFollowedIds] = useState<string[]>([])

    const mapRef = useRef<MapRef | null>(null)
    const [darkMode, setDarkMode] = useState(false)
    const mapStyle = darkMode
        ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        : "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"

    const statuses = useMemo(() => {
        const set = new Set<string>()
        concerts.forEach((c) => {
            if (c.status) set.add(c.status)
        })
        return Array.from(set).sort()
    }, [concerts])

    useEffect(() => {
        const ac = new AbortController()
        const loadArtists = async () => {
            try {
                const json = await listArtists(undefined, ac.signal)
                if (!Array.isArray(json)) return
                const map: Record<string, string> = {}
                json.forEach((artist: any) => {
                    if (artist?.id && artist?.name) {
                        map[String(artist.id)] = String(artist.name)
                    }
                })
                setArtistCatalog(map)
            } catch {
                // optional: fall back to IDs in the select
            }
        }
        loadArtists()
        return () => ac.abort()
    }, [])

    useEffect(() => {
        let active = true
        const sync = async (force = false) => {
            const ids = await loadFollowedArtistIds(force)
            if (!active) return
            setFollowedIds(ids)
        }
        sync(false)
        const handler = () => sync(true)
        window.addEventListener("followed:change", handler as EventListener)
        return () => {
            active = false
            window.removeEventListener("followed:change", handler as EventListener)
        }
    }, [])

    const artistOptions = useMemo(() => {
        const catalogIds = Object.keys(artistCatalog)
        const ids = catalogIds.length
            ? catalogIds
            : Array.from(
                  new Set(
                      concerts
                          .map((c) => (c.artist_id ? String(c.artist_id) : ""))
                          .filter(Boolean),
                  ),
              )
        return ids
            .map((id) => ({ id, label: artistCatalog[id] ?? id }))
            .sort((a, b) => a.label.localeCompare(b.label))
    }, [concerts, artistCatalog])

    const filteredConcerts = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null
        const to = toDate ? new Date(`${toDate}T23:59:59`) : null

        return concerts.filter((c) => {
            if (artistFilter !== "all" && String(c.artist_id) !== artistFilter) return false
            if (statusFilter !== "all" && c.status !== statusFilter) return false
            if (followedOnly && !getCachedFollowedArtistIds().includes(String(c.artist_id))) return false

            if (q) {
                const hay = `${c.city} ${c.country}`.toLowerCase()
                if (!hay.includes(q)) return false
            }

            if (from || to) {
                const d = c.when ? parseWhen(c.when) : null
                if (!d) return false
                if (from && d < from) return false
                if (to && d > to) return false
            }

            return true
        })
    }, [concerts, statusFilter, artistFilter, searchQuery, fromDate, toDate])

    const points = useMemo(() => filteredConcerts.filter(hasCoords), [filteredConcerts])

    useEffect(() => {
        if (!mapRef.current) return
        if (points.length === 0) return

        if (points.length === 1) {
            mapRef.current.flyTo({
                center: [points[0].lng, points[0].lat],
                zoom: 8,
                duration: 700,
            })
            return
        }

        mapRef.current.fitBounds(boundsFromConcerts(points), { padding: 70, duration: 800 })
    }, [points])

    useEffect(() => {
        const handleResize = () => mapRef.current?.resize()
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    useEffect(() => {
        const root = document.documentElement
        const syncTheme = () => setDarkMode(root.classList.contains("dark"))
        syncTheme()

        const observer = new MutationObserver(syncTheme)
        observer.observe(root, { attributes: true, attributeFilter: ["class"] })
        return () => observer.disconnect()
    }, [])

    const recenter = () => {
        if (!mapRef.current) return
        if (points.length === 0) return

        if (points.length === 1) {
            mapRef.current.flyTo({ center: [points[0].lng, points[0].lat], zoom: 8, duration: 700 })
        } else {
            mapRef.current.fitBounds(boundsFromConcerts(points), { padding: 70, duration: 800 })
        }
    }

    const clearFilters = () => {
        setStatusFilter("all")
        setArtistFilter("all")
        setFollowedOnly(false)
        setSearchQuery("")
        setFromDate("")
        setToDate("")
    }

    const hasFilters =
        statusFilter !== "all" ||
        artistFilter !== "all" ||
        followedOnly ||
        searchQuery.trim() !== "" ||
        fromDate !== "" ||
        toDate !== ""

    return (
        <div className="map-shell relative w-full h-full overflow-hidden">
            <div className="absolute inset-0 encore-map">
                <Map
                    ref={mapRef}
                    initialViewState={{ longitude: 0, latitude: 20, zoom: 1.6 }}
                    mapStyle={mapStyle}
                    style={{ width: "100%", height: "100%" }}
                    onClick={() => setSelected(null)}
                >
                    {points.map((c) => (
                        <Marker key={c.id} longitude={c.lng} latitude={c.lat} anchor="center">
                            <button
                                type="button"
                                aria-label={`${c.city} ${c.when}`}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setSelected(c)
                                }}
                                className="bg-transparent p-0"
                            >
                                <EncoreMarker active={selected?.id === c.id} />
                            </button>
                        </Marker>
                    ))}

                    {selected && hasCoords(selected) && (
                        <Popup
                            longitude={selected.lng}
                            latitude={selected.lat}
                            closeOnClick={false}
                            onClose={() => setSelected(null)}
                            offset={14}
                            className="encore-map-popup"
                        >
                            <ConcertCard
                                concert={selected}
                                artistName={artistCatalog[String(selected.artist_id)]}
                            />
                        </Popup>
                    )}
                </Map>
            </div>

            <div className="absolute left-1/2 top-6 z-10 w-[min(96vw,1100px)] -translate-x-1/2 rounded-xl border-[3px] border-border bg-card/95 p-3 relative">
                <div className="flex flex-wrap items-end gap-2 pr-40">
                    <div className="flex flex-col">
                        <label className="text-xs font-semibold text-muted-foreground">Search</label>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="City or country"
                            className="h-8 rounded-md border-[3px] border-border bg-background px-3 text-sm text-foreground focus:outline-none"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs font-semibold text-muted-foreground">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-8 rounded-md border-[3px] border-border bg-background px-3 text-sm text-foreground"
                        >
                            <option value="all">All</option>
                            {statuses.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs font-semibold text-muted-foreground">Artist</label>
                        <select
                            value={artistFilter}
                            onChange={(e) => setArtistFilter(e.target.value)}
                            className="h-8 rounded-md border-[3px] border-border bg-background px-3 text-sm text-foreground"
                        >
                            <option value="all">All artists</option>
                            {artistOptions.map((artist) => (
                                <option key={artist.id} value={artist.id}>
                                    {artist.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs font-semibold text-muted-foreground">Followed</label>
                        <button
                            type="button"
                            onClick={() => setFollowedOnly((v) => !v)}
                            className={[
                                "h-8 rounded-md border-[3px] border-border px-3 text-sm font-semibold",
                                followedOnly
                                    ? "bg-[var(--encore-accent-warm)] text-white"
                                    : "bg-secondary text-foreground",
                            ].join(" ")}
                            title={
                                followedIds.length
                                    ? `Following ${followedIds.length} artists`
                                    : "You are not following any artists yet"
                            }
                        >
                            {followedOnly ? "Following only" : "All artists"}
                        </button>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs font-semibold text-muted-foreground">From</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="h-8 rounded-md border-[3px] border-border bg-background px-3 text-sm text-foreground"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs font-semibold text-muted-foreground">To</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="h-8 rounded-md border-[3px] border-border bg-background px-3 text-sm text-foreground"
                        />
                    </div>

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="h-8 rounded-md border-[3px] border-border bg-secondary px-3 text-sm font-semibold text-foreground hover:brightness-105"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {loading && <div className="mt-2 text-sm text-muted-foreground">Loading concerts…</div>}
                {error && <div className="mt-2 text-sm text-red-300">Error: {error}</div>}

                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-row">
                    <button
                        type="button"
                        className="h-9 px-3 rounded-full border-[3px] border-border bg-card text-card-foreground text-sm font-extrabold
                       [box-shadow:3px_3px_0_var(--border)] hover:-translate-y-0.5 transition-transform"
                        onClick={recenter}
                    >
                        Re-center
                    </button>
                </div>
            </div>
        </div>
    )
}
