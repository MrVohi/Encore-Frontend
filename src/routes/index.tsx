import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { type Artist, ArtistCard } from '../components/artist'
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
    const controller = new AbortController()

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch('http://localhost:8080/api/artists', {
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json()

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
    return () => controller.abort()
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
                  <ArtistCard artist={a} index={i} showCreated={false} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
        )}
      </div>
      <Ripple 
        mainCircleSize={250}
        mainCircleOpacity={0.35}
        numCircles={15}
      />
    </div>
  )
}
