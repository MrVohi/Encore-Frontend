import { useEffect, useState } from 'react'
import useArtistFilters from '@/features/artists/filters/useArtistFilters'
import ArtistFiltersPanel from '@/features/artists/filters/ArtistFiltersPanel'

import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ListFilter, X } from 'lucide-react'
import type { Artist } from '@/types/artist'
import ArtistCard from '@/features/artists/components/ArtistCard'
import { setSelectedArtist } from '@/features/artists/state/selected'
import { listArtists } from '@/services/artists'
import { Ripple } from '@/components/ui/ripple'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

type FilterValues = {
    name: string
    genre: 'all' | 'rock' | 'pop' | 'jazz'
    order: 'asc' | 'desc'
}

function ButtonIcon({ onClick }: { onClick: () => void }) {
    return (
        <Button type="button" variant="outline" size="icon" onClick={onClick} aria-label="Open filters">
            <ListFilter />
        </Button>
    )
}


export default function ArtistsPage() {
    const [artists, setArtists] = useState<Artist[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
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
                setArtists(json as Artist[])
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

    return (
        <div className="pt-20 min-h-screen bg-background text-foreground flex items-start justify-center overflow-x-hidden">
            <div className="mx-auto w-full max-w-3xl px-5">
                <div className="mb-6 flex items-center">
                    <h1 className="text-2xl font-bold">Artists</h1>
                    <div>
                        <ButtonIcon onClick={() => setFilterOpen(true)} />
                    </div>
                </div>

                {loading && <p>Loading…</p>}
                {error && <p className="text-red-300">Error: {error}</p>}

                {!loading && !error && (
                    <div className="py-4">
                        <Carousel className="w-full" opts={{ align: 'start' }}>
                            <CarouselContent className='-ml-4'>
                                {artists.map((a, i) => (
                                    <CarouselItem key={a.id} className='pl-4 shrink-0 basis-full sm:basis-1/2 lg:basis-1/3'>
                                        <div className='pt-4 pl-4 pr-2 pb-6'>
                                            <ArtistCard artist={a} index={i} onClick={() => setSelectedArtist(a)} />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                        </Carousel>
                    </div>
                )}

                {filterOpen && (
                    <ArtistFiltersPanel
                        open={filterOpen}
                        onClose={() => setFilterOpen(false)}
                        filters={filters}
                        setFilters={setFilters}
                        resetFilters={resetFilters}
                    />
                )}

            </div>
            <Ripple mainCircleSize={250} mainCircleOpacity={0.35} numCircles={15} />
        </div>
    )
}
