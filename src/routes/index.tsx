import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

import { ListFilter, X } from "lucide-react"
import { type Artist, ArtistCard } from "../components/artist"

export const Route = createFileRoute("/")({
  component: Home,
})

export function ButtonIcon({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="bg-gray-700 hover:bg-gray-800"
      onClick={onClick}
      aria-label="Open filters"
    >
      <ListFilter />
    </Button>
  )
}

type FilterValues = {
  name: string
  genre: "all" | "rock" | "pop" | "jazz" 
  order: "asc" | "desc"
}

function Home() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  async function loadArtists(filters?: Partial<FilterValues>) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      setLoading(true)
      setError(null)

      const url = new URL("http://localhost:8080/api/artists")

      const name = filters?.name?.trim()
      if (name) url.searchParams.set("name", name)

      if (filters?.genre && filters.genre !== "all") {
        url.searchParams.set("genre", filters.genre)
      }

      if (filters?.order) {
        url.searchParams.set("order", filters.order)
      }

      const res = await fetch(url.toString(), { signal: controller.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = await res.json()
      if (!Array.isArray(json)) throw new Error("Unexpected response (not an array)")

      setArtists(json as Artist[])
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return
      setArtists([])
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArtists()
    return () => abortRef.current?.abort()
  }, [])

  return (
    <div className="pt-24 min-h-screen bg-[#282c34] text-white flex items-start justify-center p-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Artists</h1>
          <ButtonIcon onClick={() => setFiltersOpen(true)} />
        </div>

        {filtersOpen && (
          <FilterPanel
            onClose={() => setFiltersOpen(false)}
            onApply={async (values) => {
              await loadArtists(values)
              setFiltersOpen(false)
            }}
          />
        )}

        {loading && <p>Loading…</p>}
        {error && <p className="text-red-300">Error: {error}</p>}

        {!loading && !error && (
          <div className="flex flex-wrap gap-6">
            {artists.map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FilterPanel({
  onClose,
  onApply,
}: {
  onClose: () => void
  onApply: (values: FilterValues) => void | Promise<void>
}) {
  const { register, handleSubmit, watch, reset, setValue } = useForm<FilterValues>({
    defaultValues: { name: "", genre: "all", order: "desc" },
  })

  const selectedGenre = watch("genre")
  const selectedOrder = watch("order")

  const genres: FilterValues["genre"][] = ["all", "rock", "pop", "jazz"]
  const orders: FilterValues["order"][] = ["asc", "desc"]

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close filters"
      />

      {/* panel */}
      <div className="absolute right-6 top-24 w-[360px] rounded-xl border border-gray-700 bg-[#1f232b] p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Filters</h2>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X />
          </Button>
        </div>

        <form
          className="space-y-5"
          onSubmit={handleSubmit(async (values) => {
            await onApply(values)
          })}
        >
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm text-gray-200">Name</label>
            <InputGroup>
              <InputGroupInput
                placeholder="Artist name…"
                {...register("name")}
              />
              <InputGroupAddon>⌕</InputGroupAddon>
            </InputGroup>
          </div>

          {/* Genre as “buttons” (single choice) */}
          <div className="space-y-2">
            <label className="text-sm text-gray-200">Genre</label>
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <Button
                  key={g}
                  type="button"
                  variant={selectedGenre === g ? "default" : "outline"}
                  className="capitalize bg-gray-700 hover:bg-gray-800"
                  onClick={() => setValue("genre", g)} // ✅ fully typed, no `any`
                >
                  {g}
                </Button>
              ))}
            </div>

            {/* keep it in the form (hidden input) */}
            <input type="hidden" {...register("genre")} />
          </div>

          {/* Order as “buttons” */}
          <div className="space-y-2">
            <label className="text-sm text-gray-200">Order</label>
            <div className="flex gap-2">
              {orders.map((o) => (
                <Button
                  key={o}
                  type="button"
                  className="capitalize bg-gray-700 hover:bg-gray-800"
                  variant={selectedOrder === o ? "default" : "outline"}
                  onClick={() => setValue("order", o)}
                >
                  {o.toUpperCase()}
                </Button>
              ))}
            </div>

            <input type="hidden" {...register("order")} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 capitalize bg-gray-700 hover:bg-gray-800"
              onClick={() => reset({ name: "", genre: "all", order: "desc" })}
            >
              Reset
            </Button>
            <Button type="submit" className="flex-1 capitalize bg-gray-700 hover:bg-gray-800">
              Apply
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
