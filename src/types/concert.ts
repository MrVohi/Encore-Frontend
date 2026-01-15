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

export function hasCoords(
    c: Concert,
): c is Concert & { lat: number; lng: number } {
    return Number.isFinite(c.lat) && Number.isFinite(c.lng)
}
