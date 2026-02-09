import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { useAuth } from '@/integrations/auth-context'
import { followArtist, getCachedFollowedArtistIds, loadFollowedArtistIds, unfollowArtist } from '@/lib/following'
import { resolveAssetUrl } from '@/lib/api'

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
  const { user } = useAuth()
  const navigate = useNavigate()
  const [followed, setFollowed] = useState(false)

  const imageUrl = resolveAssetUrl(artist.artwork_url ?? artist.image_url ?? '')
  const hasImageUrl = imageUrl !== ''

  const showImage = hasImageUrl && imgOk
  const createdDate = new Date(artist.created_at)

  useEffect(() => {
    if (!user) {
      setFollowed(false)
      return
    }
    loadFollowedArtistIds().then((ids) => {
      setFollowed(ids.includes(String(artist.id)))
    })
  }, [artist.id, user])

  const handleFollow = async () => {
    if (!user) {
      navigate({ to: '/login' })
      return
    }
    const currentlyFollowed = getCachedFollowedArtistIds().includes(String(artist.id))
    try {
      if (currentlyFollowed) {
        await unfollowArtist(artist.id)
        setFollowed(false)
      } else {
        await followArtist(artist.id)
        setFollowed(true)
      }
    } catch {
      // keep previous state on error
    }
  }

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

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={handleFollow}
          className={[
            'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold',
            followed
              ? 'border-rose-400 bg-rose-500/20 text-rose-100'
              : 'border-white/20 text-white/80',
          ].join(' ')}
        >
          <Heart size={16} className={followed ? 'fill-rose-400' : 'fill-transparent'} />
          {followed ? 'Following' : 'Follow'}
        </button>
      </div>
    </div>
  )
}
