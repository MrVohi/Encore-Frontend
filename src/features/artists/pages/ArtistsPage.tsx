import { useEffect, useMemo, useRef, useState } from 'react'
import useArtistFilters from '@/features/artists/filters/useArtistFilters'
import ArtistFiltersPanel from '@/features/artists/filters/ArtistFiltersPanel'

import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ListFilter, Search, X } from 'lucide-react'
import type { Artist } from '@/types/artist'
import type { Album } from '@/types/album'
import ArtistCard from '@/features/artists/components/ArtistCard'
import { setSelectedArtist } from '@/features/artists/state/selected'
import { getAlbumsForArtist, listArtists } from '@/services/artists'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

export default function ArtistsPage() {
    const [artists, setArtists] = useState<Artist[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [albums, setAlbums] = useState<Array<Album & { artist_name?: string }>>([])
    const [albumsLoading, setAlbumsLoading] = useState(false)
    const [albumsError, setAlbumsError] = useState<string | null>(null)
    const [albumsEnabled, setAlbumsEnabled] = useState(false)
    const albumsSectionRef = useRef<HTMLDivElement | null>(null)
    const [filterOpen, setFilterOpen] = useState(false)
    const { filters, setFilters, resetFilters } = useArtistFilters()

    useEffect(() => {
        const ac = new AbortController()
        let t: any = null
        async function load() {
            try {
                setLoading(true)
                setError(null)

                const orderMap: Record<string, string> = { name_asc: 'name_asc', name_desc: 'name_desc', created_at_desc: 'created_at_desc', created_at_asc: 'created_at_asc' }
                const opts: any = {}
                if (filters.name) opts.name = filters.name
                if (filters.genre && filters.genre !== 'all') opts.genre = filters.genre.replaceAll(' ', '+')
                if (filters.order) opts.order = orderMap[filters.order] ?? undefined
                const json = await listArtists(opts, ac.signal)
                if (!Array.isArray(json)) throw new Error('Unexpected response (not an array)')
                const nextArtists: Artist[] = json
                setArtists(nextArtists)
            } catch (e) {
                if (e instanceof DOMException && e.name === 'AbortError') return
                setArtists([])
                setError(e instanceof Error ? e.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }

        // debounce slightly to avoid hammering backend when typing
        t = setTimeout(() => {
            load()
        }, 250)

        return () => {
            clearTimeout(t)
            ac.abort()
        }
    }, [filters.name, filters.genre, filters.order])

    useEffect(() => {
        if (!albumsSectionRef.current) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setAlbumsEnabled(true)
                    observer.disconnect()
                }
            },
            { rootMargin: '200px' },
        )

        observer.observe(albumsSectionRef.current)

        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        let cancelled = false

        const loadAlbums = async () => {
            if (!albumsEnabled || !artists.length) {
                setAlbums([])
                return
            }
            setAlbumsLoading(true)
            setAlbumsError(null)
            try {
                const results: Array<Album & { artist_name?: string }>[] = []
                const batchSize = 3
                for (let i = 0; i < artists.length; i += batchSize) {
                    const batch = artists.slice(i, i + batchSize)
                    const chunk = await Promise.all(
                        batch.map(async (artist) => {
                            const list = await getAlbumsForArtist(artist.id)
                            if (!Array.isArray(list)) return []
                            return list.map((album) => ({ ...album, artist_name: artist.name }))
                        }),
                    )
                    results.push(...chunk)
                    if (cancelled) return
                    await new Promise<void>((resolve) => {
                        if ('requestIdleCallback' in window) {
                            ; (window as any).requestIdleCallback(() => resolve())
                        } else {
                            setTimeout(() => resolve(), 60)
                        }
                    })
                }
                if (cancelled) return
                setAlbums(results.flat())
            } catch (e) {
                if (cancelled) return
                setAlbums([])
                setAlbumsError(e instanceof Error ? e.message : 'Failed to load albums')
            } finally {
                if (!cancelled) setAlbumsLoading(false)
            }
        }

        loadAlbums()

        return () => {
            cancelled = true
        }
    }, [artists, albumsEnabled])

    const filteredArtists = useMemo(() => {
        const nameQuery = filters.name.trim().toLowerCase()
        const genreQuery = filters.genre.trim().toLowerCase()

        const next = artists.filter((artist) => {
            const nameOk = !nameQuery || artist.name.toLowerCase().includes(nameQuery)
            const genreOk =
                !genreQuery ||
                genreQuery === 'all' ||
                artist.genre.toLowerCase() === genreQuery
            return nameOk && genreOk
        })

        const sorted = [...next]
        switch (filters.order) {
            case 'name_asc':
                sorted.sort((a, b) => a.name.localeCompare(b.name))
                break
            case 'name_desc':
                sorted.sort((a, b) => b.name.localeCompare(a.name))
                break
            case 'created_at_asc':
                sorted.sort(
                    (a, b) =>
                        new Date(a.created_at).getTime() -
                        new Date(b.created_at).getTime(),
                )
                break
            case 'created_at_desc':
            default:
                sorted.sort(
                    (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime(),
                )
                break
        }

        return sorted
    }, [artists, filters.name, filters.genre, filters.order])

    const albumPreviewByArtist = useMemo(() => {
        const map: Record<string, string[]> = {}
        albums.forEach((album) => {
            if (!map[album.artist_id]) map[album.artist_id] = []
            if (album.title) map[album.artist_id].push(album.title)
        })
        Object.keys(map).forEach((id) => {
            map[id] = map[id].slice(0, 3)
        })
        return map
    }, [albums])

    const albumCountByArtist = useMemo(() => {
        const map: Record<string, number> = {}
        albums.forEach((album) => {
            map[album.artist_id] = (map[album.artist_id] ?? 0) + 1
        })
        return map
    }, [albums])

    const artistById = useMemo(() => {
        const map: Record<string, Artist> = {}
        artists.forEach((artist) => {
            map[artist.id] = artist
        })
        return map
    }, [artists])

    const artistCarousel = useMemo(
        () => (
            <Carousel className="w-full" opts={{ align: 'start' }}>
                <CarouselContent className="-ml-4">
                    {filteredArtists.map((a, i) => (
                        <CarouselItem key={a.id} className="pl-4 shrink-0 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                            <div className="pt-4 pl-4 pr-2 pb-8">
                                <ArtistCard
                                    artist={a}
                                    index={i}
                                    onClick={() => setSelectedArtist(a)}
                                    variant="record"
                                    albumPreview={albumPreviewByArtist[a.id]}
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        ),
        [filteredArtists, albumPreviewByArtist],
    )

    const renderArtistShelf = (label: string, data: Artist[]) => (
        <div className="panel shelf mt-8">
            <div className="shelfhead">
                <div className="label">{label}</div>
                <div className="label">{data.length} artists</div>
            </div>
            <Carousel className="w-full" opts={{ align: 'start' }}>
                <CarouselContent className="-ml-4">
                    {data.map((a, i) => (
                        <CarouselItem key={`${label}-${a.id}`} className="pl-4 shrink-0 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                            <div className="pt-4 pl-4 pr-2 pb-8">
                                <ArtistCard
                                    artist={a}
                                    index={i}
                                    onClick={() => setSelectedArtist(a)}
                                    variant="record"
                                    albumPreview={albumPreviewByArtist[a.id]}
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </div>
    )

    const featuredArtists = useMemo(() => {
        if (!filteredArtists.length) return []
        const seed = new Date().toDateString()
        const hash = (value: string) => {
            let h = 0
            for (let i = 0; i < value.length; i += 1) {
                h = (h << 5) - h + value.charCodeAt(i)
                h |= 0
            }
            return Math.abs(h)
        }
        return [...filteredArtists]
            .sort((a, b) => hash(a.id + seed) - hash(b.id + seed))
            .slice(0, 8)
    }, [filteredArtists])

    const newArtists = useMemo(
        () =>
            [...filteredArtists]
                .sort(
                    (a, b) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                )
                .slice(0, 8),
        [filteredArtists],
    )

    const popularArtists = useMemo(() => {
        const score = (artist: Artist) => {
            const raw = artist as Artist & Record<string, unknown>
            const followers = Number(
                raw.followers_count ??
                raw.followers ??
                raw.followersCount ??
                0,
            )
            const tickets = Number(
                raw.tickets_sold ??
                raw.ticketsSold ??
                raw.ticket_count ??
                raw.tickets ??
                0,
            )
            return followers + tickets
        }

        return [...filteredArtists]
            .sort((a, b) => score(b) - score(a))
            .slice(0, 8)
    }, [filteredArtists, albumCountByArtist])

    const orderLabel = useMemo(() => {
        switch (filters.order) {
            case 'created_at_desc':
                return 'Newest'
            case 'created_at_asc':
                return 'Oldest'
            case 'name_asc':
                return 'Name A-Z'
            case 'name_desc':
                return 'Name Z-A'
            default:
                return 'Newest'
        }
    }, [filters.order])

    const hasActiveFilters =
        !!filters.name ||
        (filters.genre && filters.genre !== 'all') ||
        !!filters.order

    return (
        <div className="artists-encore min-h-screen text-foreground flex items-start justify-center overflow-x-hidden">
            <div className="artists-vignette" aria-hidden="true" />
            <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-14">
                <div className="pagehead mt-3">
                    <div className="max-w-2xl">
                        <div className="kicker">catalog</div>
                        <h1 className="h1">Artists</h1>
                        <p className="subline">
                            Browse artists, discover releases, and jump straight into what fits your mood today.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" onClick={() => setFilterOpen(true)}>
                            <ListFilter className="mr-2 h-4 w-4" />
                            Filters
                        </Button>
                        {hasActiveFilters && (
                            <Button type="button" variant="outline" onClick={resetFilters}>
                                <X className="mr-2 h-4 w-4" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                <div className="artists-search-row">
                    <InputGroup className="artists-search">
                        <InputGroupAddon className="artists-search-addon">
                            <Search />
                        </InputGroupAddon>
                        <InputGroupInput
                            placeholder="Search artists..."
                            value={filters.name}
                            onChange={(e) => setFilters({ name: e.target.value })}
                            className="artists-search-input"
                        />
                    </InputGroup>
                    <div className="shelfmeta">
                        <span>{filteredArtists.length} artists</span>
                        <span>{orderLabel}</span>
                    </div>
                </div>

                {loading && <p>Loading…</p>}
                {error && <p className="text-red-300">Error: {error}</p>}

                {!loading && !error && (
                    <div className="panel shelf">
                        <div className="shelfhead">
                            <div className="label">Shelf</div>
                            <div className="label">{orderLabel}</div>
                        </div>
                        {artistCarousel}
                    </div>
                )}

                {!loading && !error && renderArtistShelf('Featured artists', featuredArtists)}
                {!loading && !error && renderArtistShelf('New artists', newArtists)}
                {!loading && !error && renderArtistShelf('Popular artists', popularArtists)}

                <div ref={albumsSectionRef} className="panel shelf mt-8">
                    <div className="shelfhead">
                        <div className="label">Albums</div>
                        <div className="label">{albums.length} total</div>
                    </div>

                    {!albumsEnabled && (
                        <div className="px-3 pb-3 text-sm text-muted-foreground flex items-center justify-between gap-3">
                            <span>Load albums when you need them to keep the page fast.</span>
                            <button
                                type="button"
                                onClick={() => setAlbumsEnabled(true)}
                                className="h-8 rounded-full border border-border bg-card px-3 text-sm font-semibold text-foreground hover:brightness-105"
                            >
                                Show albums
                            </button>
                        </div>
                    )}

                    {albumsEnabled && albumsLoading && (
                        <div className="px-3 pb-3 text-sm text-muted-foreground">Loading albums…</div>
                    )}
                    {albumsEnabled && albumsError && (
                        <div className="px-3 pb-3 text-sm text-red-300">Error: {albumsError}</div>
                    )}

                    {albumsEnabled && !albumsLoading && !albumsError && (
                        <div className="album-grid">
                            {albums.map((album) => {
                                const release = album.release_date
                                    ? new Date(album.release_date).toLocaleDateString()
                                    : 'Unknown'
                                const linkedArtist = artistById[album.artist_id]
                                return (
                                    <div
                                        key={album.id}
                                        className="album-record cursor-pointer transition-transform hover:-translate-y-0.5"
                                        onClick={() => {
                                            if (linkedArtist) setSelectedArtist(linkedArtist)
                                        }}
                                    >
                                        <div className="album-record-title">{album.title}</div>
                                        <div className="album-record-meta">
                                            <span>{album.artist_name ?? 'Unknown artist'}</span>
                                            <span>{release}</span>
                                        </div>
                                    </div>
                                )
                            })}
                            {!albums.length && (
                                <div className="px-3 pb-3 text-sm text-muted-foreground">No albums found.</div>
                            )}
                        </div>
                    )}
                </div>

                <ArtistFiltersPanel
                    open={filterOpen}
                    onClose={() => setFilterOpen(false)}
                    filters={filters}
                    setFilters={setFilters}
                    resetFilters={resetFilters}
                />

            </div>
        </div>
    )
}
