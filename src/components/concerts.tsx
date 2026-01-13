import Map, { Marker, Popup } from "react-map-gl/maplibre"
import "maplibre-gl/dist/maplibre-gl.css"
import { useEffect, useState } from "react"

export type Concert = {
  id: string
  artist_id: string
  when: string
  city: string
  country: string
  capacity: number
  status: string
  created_at: string
  lat: number
  lng: number
}

function parseWhen(when: string) {
  // safer than "YYYY-MM-DD HH:mm:ss"
  const d = new Date(when.replace(" ", "T"))
  return Number.isNaN(d.getTime()) ? null : d
}

export function ConcertCard({ concert }: { concert: Concert }) {
  const d = concert.when ? parseWhen(concert.when) : null
  const date = d ? d.toLocaleString() : "Unknown"

  return (
    <div className="bg-white/5 rounded-lg p-3 w-full">
      <div className="font-semibold">
        {concert.city} - {concert.country}
      </div>
      <div className="text-sm opacity-70">{date}</div>
      <div className="text-sm opacity-60">Capacity: {concert.capacity}</div>
      <div className="text-sm opacity-60">Status: {concert.status}</div>
    </div>
  )
}

async function fetchConcerts(signal: AbortSignal): Promise<Concert[]> {
  const res = await fetch(`http://localhost:8080/api/concerts`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function boundsFromConcerts(concerts: Concert[]): [[number, number], [number, number]] {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity

  for (const c of concerts) {
    minLng = Math.min(minLng, c.lng)
    minLat = Math.min(minLat, c.lat)
    maxLng = Math.max(maxLng, c.lng)
    maxLat = Math.max(maxLat, c.lat)
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}

export function ConcertMap() {
  const [concerts, setConcerts] = useState<Concert[]>([])
  const [selected, setSelected] = useState<Concert | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    fetchConcerts(ac.signal).then(setConcerts).catch(() => { })
    return () => ac.abort()
  }, [])

  return (
    <div style={{ height: "calc(100vh - 64px)" }}>
      <Map
        initialViewState={{ longitude: 0, latitude: 20, zoom: 1.6 }}
        mapStyle="https://demotiles.maplibre.org/style.json"
        style={{ width: "100%", height: "100%" }}
      >
        {concerts.map((c) => (
          <Marker key={c.id} longitude={c.lng} latitude={c.lat} anchor="center">
            <button
              type="button"
              className="h-3 w-3 rounded-full bg-white border border-black/50 shadow"
              onClick={(e) => {
                e.stopPropagation()
                setSelected(c)
              }}
              aria-label={`${c.city} ${c.when}`}
            />
          </Marker>
        ))}

        {selected && (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            closeOnClick={false}
            onClose={() => setSelected(null)}
          >
            <ConcertCard concert={selected} />
          </Popup>
        )}
      </Map>
    </div>
  )
}
