import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { Artist } from '@/types/artist'
import { listArtists } from "@/services/artists"
import ArtistCard from '@/features/artists/components/ArtistCard'
import { Ripple } from '../components/ui/ripple'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  useEffect(() => {
    const ac = new AbortController()
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const json = await listArtists(ac.signal)
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
    load()
    return () => ac.abort()
  }, [])

  return (
    <div className="pt-20 min-h-screen bg-background text-foreground flex items-start justify-center overflow-x-hidden">
      <div className="mx-auto w-full max-w-3xl px-5">
        <h1 className="text-2xl font-bold mb-6">Artists</h1>

        {loading && <p>Loading…</p>}
        {error && <p className="text-red-300">Error: {error}</p>}

        {!loading && !error && (
          <div className="py-4">
            <Carousel className="w-full" opts={{ align: "start" }}>
              <CarouselContent className="-ml-4">
                {artists.map((a, i) => (
                  <CarouselItem
                    key={a.id}
                    className="pl-4 shrink-0 basis-full sm:basis-1/2 lg:basis-1/3"
                  >
                    {/* GUTTER: keeps hover lift + shadow from getting clipped */}
                    <div className="pt-4 pl-4 pr-2 pb-6">
                      <ArtistCard artist={a} index={i} onClick={async () => {
                        const { setSelectedArtist } = await import('@/features/artists/state/selected')
                        setSelectedArtist(a)
                      }} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}
        {/* ArtistPopup mounted once at app root */}
      </div>
      <Ripple
        mainCircleSize={250}
        mainCircleOpacity={0.35}
        numCircles={15}
      />
    </div>
  )
}
