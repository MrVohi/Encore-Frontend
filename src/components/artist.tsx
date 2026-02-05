import { useState } from 'react'

export type Artist = {
  id: string
  name: string
  genre: string
  image_url?: string
  artwork_url?: string
  preview_url?: string
  created_at: string
}

export function ArtistCard({
  artist,
  onClick,
}: {
  artist: Artist
  onClick?: () => void
}) {
  const [imgOk, setImgOk] = useState(true)

  const imageUrl = artist.artwork_url ?? artist.image_url ?? ''
  const hasImageUrl = imageUrl !== 'None' && imageUrl.trim() !== ''

  const showImage = hasImageUrl && imgOk
  const createdDate = new Date(artist.created_at)

  return (
    <div
      className={[
        'text-center bg-white/5 rounded-lg p-4 w-[280px]',
        onClick ? 'cursor-pointer hover:bg-white/10 transition' : '',
      ].join(' ')}
      role={onClick ? 'button' : undefined}
      onClick={onClick}
    >
      {showImage && (
        <img
          src={imageUrl}
          alt={artist.name}
          className="mx-auto w-40 h-40 object-cover rounded"
          onError={() => setImgOk(false)}
        />
      )}

      <div className="mt-3 space-y-1">
        <div className="font-semibold text-lg">{artist.name}</div>
        <div className="opacity-70">{artist.genre}</div>
        <div className="text-sm opacity-60">
          Created: {createdDate.toLocaleString()}
        </div>
      </div>
    </div>
  )
}
