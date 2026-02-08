import { Search } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import useSearch from "../hooks/useSearch"
import { SearchResults } from "./SearchResults"

import { getArtist } from "@/services/artists"
import { getAlbum } from "@/services/albums"
import type { SearchResult } from "@/types/search"
import { setSelectedArtist } from "@/features/artists/state/selected"

export default function SearchBar({ onSelectArtist }: { onSelectArtist?: (a: any) => void }) {
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)

  const results = useSearch(q)

  const [artistNames, setArtistNames] = useState<Record<string, string>>({})
  const [albumInfo, setAlbumInfo] = useState<Record<string, { title: string; artist_id: string }>>({})

  const wrapRef = useRef<HTMLDivElement | null>(null)

  // Resolve names when results update (side effect => useEffect, not useMemo)
  useEffect(() => {
    let cancelled = false

      ; (async () => {
        const artistIds = new Set<string>()
        const albumIds = new Set<string>()

        for (const r of results) {
          if (r.kind === "album" && r.parent_id) artistIds.add(r.parent_id)
          if (r.kind === "track" && r.parent_id) albumIds.add(r.parent_id)
        }

        for (const id of albumIds) {
          const info = await getAlbum(id).catch(() => null)
          if (cancelled || !info) continue

          setAlbumInfo((p) => ({ ...p, [id]: { title: info.title, artist_id: info.artist_id } }))
          artistIds.add(info.artist_id)
        }

        for (const id of artistIds) {
          const a = await getArtist(id).catch(() => null)
          if (cancelled || !a) continue
          setArtistNames((p) => ({ ...p, [id]: a.name }))
        }
      })()

    return () => {
      cancelled = true
    }
  }, [results])

  const handleSelect = useCallback(
    async (r: SearchResult) => {
      setQ(r.label ?? "")
      setOpen(false)

      if (r.kind === "artist") {
        const a = await getArtist(r.id).catch(() => null)
        if (a) {
          setSelectedArtist(a)
          onSelectArtist?.(a)
        }
        return
      }

      if (r.kind === "album" && r.parent_id) {
        const artist = await getArtist(r.parent_id).catch(() => null)
        if (artist) {
          setSelectedArtist(artist)
          onSelectArtist?.(artist)
        }
        return
      }

      console.warn("track selection not resolved yet")
    },
    [onSelectArtist],
  )

  return (
    <div ref={wrapRef} className="theme-test-search relative z-50 w-[min(20rem,100%)]">
      {/* Input shell */}
      <div className="relative h-10 rounded-full bg-card overflow-hidden brutal">
        {/* Icon */}
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

        <input
          className={[
            "h-10 w-full bg-transparent border-0 shadow-none",
            "pl-10 pr-4",
            "text-sm leading-10",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
          ].join(" ")}
          value={q}
          placeholder="Search..."
          onChange={(e) => {
            setQ(e.target.value ?? "")
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false)
          }}
        />
      </div>

      {open && (
        <SearchResults
          results={results}
          artistNames={artistNames}
          albumInfo={albumInfo}
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}
