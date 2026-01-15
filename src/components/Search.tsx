export type SearchResult = {
    kind: "artist" | "album" | "track" | string
    id: string
    label: string
    parent_id?: string
  }
  
  export type ArtistNameMap = Record<string, string>
  export type AlbumInfoMap = Record<string, { title: string; artist_id: string }>
  
  export function ShowResults({
    results,
    artistNames,
    albumInfo,
    onSelect,
  }: {
    results: SearchResult[]
    artistNames: ArtistNameMap
    albumInfo: AlbumInfoMap
    onSelect?: (r: SearchResult) => void
  }) {
    if (!results.length) return null
  
    const subtitleFor = (r: SearchResult) => {
      if (r.kind === "album") {
        const artistName = r.parent_id ? artistNames[r.parent_id] : undefined
        return artistName ? `by ${artistName}` : undefined
      }
  
      if (r.kind === "track") {
        const album = r.parent_id ? albumInfo[r.parent_id] : undefined
        const artistName = album ? artistNames[album.artist_id] : undefined
        const parts = [album?.title, artistName].filter(Boolean)
        return parts.length ? parts.join(" • ") : undefined
      }
  
      return undefined
    }
  
    return (
      <div className="absolute top-full left-0 mt-2 w-full z-[60]">
        <div
          className={[
            "bg-popover text-popover-foreground",
            "border-[3px] border-border rounded-xl overflow-hidden",
            "[box-shadow:4px_4px_0_var(--border)]",
            "max-h-72 overflow-y-auto",
          ].join(" ")}
        >
          {results.map((r) => {
            const subtitle = subtitleFor(r)
  
            return (
              <button
                key={`${r.kind}:${r.id}`}
                type="button"
                className={[
                  "w-full text-left px-4 py-2",
                  "hover:bg-accent hover:text-accent-foreground",
                  "transition-colors",
                ].join(" ")}
                // onMouseDown so it selects before the input loses focus
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect?.(r)
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold truncate">{r.label}</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/30 uppercase">
                    {r.kind}
                  </span>
                </div>
  
                {subtitle ? (
                  <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>
    )
  }
  