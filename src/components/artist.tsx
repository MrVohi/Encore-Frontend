import { useMemo, useState } from "react"

export type Artist = {
  id: string
  name: string
  genre: string
  image_url: string
  preview_url: string
  created_at: string
}

type Props = {
  artist: Artist
  index?: number
  showCreated?: boolean
}

export function ArtistCard({ artist, index = 0, showCreated = false }: Props) {
  const [imgOk, setImgOk] = useState(true)

  const hasImageUrl = artist.image_url !== "None" && artist.image_url.trim() !== ""
  const showImage = hasImageUrl && imgOk

  const createdDate = useMemo(() => new Date(artist.created_at), [artist.created_at])

  // Same 3 gradient options as the concept HTML :contentReference[oaicite:1]{index=1}
  const gradient = useMemo(() => {
    const gradients = [
      // cool -> warm
      "linear-gradient(135deg, var(--encore-accent-cool, #3d5a80) 0%, var(--encore-accent-warm, #e07a5f) 100%)",
      // warm -> light
      "linear-gradient(135deg, var(--encore-accent-warm, #e07a5f) 0%, var(--encore-accent-light, #f4a261) 100%)",
      // extra “sage” gradient used in the concept
      "linear-gradient(135deg, #81b29a 0%, var(--encore-accent-cool, #3d5a80) 100%)",
    ]
    return gradients[index % gradients.length]
  }, [index])

  return (
    <div
      className={[
        "bg-card text-card-foreground",
        "border-[3px] border-border rounded-xl overflow-hidden",
        "transition-all duration-300 cursor-pointer",
        "hover:-translate-x-2 hover:-translate-y-2",
        "[box-shadow:4px_4px_0_var(--border)] hover:[box-shadow:6px_6px_0_var(--border)]",
      ].join(" ")}
    >
      {/* Image / Gradient header (200px like the concept) */}
      <div className="relative h-[200px] w-full">
        {/* Gradient fallback */}
        <div className="absolute inset-0" style={{ backgroundImage: gradient, backgroundSize: "cover" }} />

        {/* Real image if valid */}
        {showImage && (
          <img
            src={artist.image_url}
            alt={artist.name}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImgOk(false)}
          />
        )}

        {/* ♪ overlay only when using gradient fallback (like the concept pseudo-element) :contentReference[oaicite:2]{index=2} */}
        {!showImage && (
          <div className="absolute inset-0 flex items-center justify-center select-none">
            <span className="text-[5rem] leading-none text-white/20 -rotate-12">♪</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="text-[1.1rem] font-extrabold text-foreground mb-1">{artist.name}</div>
        <div className="text-sm font-semibold text-muted-foreground">{artist.genre}</div>

        {showCreated && (
          <div className="mt-2 text-xs font-medium text-muted-foreground/80">
            Created: {createdDate.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}
