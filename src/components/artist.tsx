import { useState } from 'react'

export type Artist = {
  id: string
  name: string
  genre: string
  image_url: string
  preview_url: string
  created_at: string 
}

export function ArtistCard({ artist }: { artist: Artist }) {
  const [imgOk, setImgOk] = useState(true)

  const hasImageUrl =
    artist.image_url !== 'None' && artist.image_url.trim() !== ''

  const showImage = hasImageUrl && imgOk
  const createdDate = new Date(artist.created_at)

  return (
    <div className="text-center bg-white/5 rounded-lg p-4 w-[280px]">
      {showImage && (
        <img
          src={artist.image_url}
          alt={artist.name}
          className="mx-auto w-40 h-40 object-cover rounded"
          onError={() => setImgOk(false)} // hide image if URL is broken
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