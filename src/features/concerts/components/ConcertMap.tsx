import "maplibre-gl/dist/maplibre-gl.css"

import { useEffect, useMemo, useRef, useState } from "react"
import Map, { Marker, Popup, type MapRef } from "react-map-gl/maplibre"

import type { Concert } from "@/types/concert"
import { hasCoords } from "@/types/concert"

import { useConcerts } from "@/features/concerts/hooks/useConcerts"
import ConcertCard from "@/features/concerts/components/ConcertCard"
import { boundsFromConcerts } from "@/features/concerts/utils/bounds"

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

    const mapRef = useRef<MapRef | null>(null)
    const mapStyle = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"

    const points = useMemo(() => concerts.filter(hasCoords), [concerts])

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

    const recenter = () => {
        if (!mapRef.current) return
        if (points.length === 0) return

        if (points.length === 1) {
            mapRef.current.flyTo({ center: [points[0].lng, points[0].lat], zoom: 8, duration: 700 })
        } else {
            mapRef.current.fitBounds(boundsFromConcerts(points), { padding: 70, duration: 800 })
        }
    }

    return (
        <div className="pt-16 h-[calc(100vh-4rem)] w-full">
            <div className="px-5 pb-3">
                {loading && <div className="text-sm text-muted-foreground">Loading concerts…</div>}
                {error && <div className="text-sm text-red-300">Error: {error}</div>}
                {!loading && !error && (
                    <div className="text-sm text-muted-foreground">
                        Showing {points.length} concert{points.length === 1 ? "" : "s"}
                    </div>
                )}
            </div>

            <div className="relative h-[calc(100%-3rem)] w-full encore-map">
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
                            <ConcertCard concert={selected} />
                        </Popup>
                    )}
                </Map>

                {/* UI buttons, Encore-brutal style */}
                <div className="absolute right-5 top-5 z-10 flex flex-col gap-2">
                    <button
                        type="button"
                        className="h-10 px-4 rounded-full border-[3px] border-border bg-card text-card-foreground font-extrabold
                       [box-shadow:3px_3px_0_var(--border)] hover:-translate-y-0.5 transition-transform"
                        onClick={recenter}
                    >
                        Re-center
                    </button>

                    <button
                        type="button"
                        className="h-10 px-4 rounded-full border-[3px] border-border bg-secondary text-secondary-foreground font-extrabold
                       [box-shadow:3px_3px_0_var(--border)] hover:-translate-y-0.5 transition-transform"
                        onClick={() => setSelected(null)}
                    >
                        Close popup
                    </button>
                </div>
            </div>
        </div>
    )
}
