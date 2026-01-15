import { useEffect, useMemo, useState } from 'react'
import type { Artist } from '@/types/artist'
import { isValidHttpUrl } from '../utils/url'

export default function ArtistCard({
  artist,
  index = 0,
  onClick,
}: {
  artist: Artist
  index?: number
  onClick?: () => void
}) {
  const src = isValidHttpUrl(artist.image_url) ? artist.image_url.trim() : ''
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgOk, setImgOk] = useState(true)

  useEffect(() => {
    setImgLoaded(false)
    setImgOk(true)
  }, [src])

  const hasImageUrl = artist.image_url !== 'None' && artist.image_url.trim() !== ''
  const showImage = !!src && hasImageUrl && imgOk

  const gradient = useMemo(() => {
    const gradients = [
      'linear-gradient(135deg, var(--encore-accent-cool, #3d5a80) 0%, var(--encore-accent-warm, #e07a5f) 100%)',
      'linear-gradient(135deg, var(--encore-accent-warm, #e07a5f) 0%, var(--encore-accent-light, #f4a261) 100%)',
      'linear-gradient(135deg, #81b29a 0%, var(--encore-accent-cool, #3d5a80) 100%)',
    ]
    return gradients[index % gradients.length]
  }, [index])

  const interactive = !!onClick

  return (
    <div
      className={[
        'bg-card text-card-foreground',
        'border-[3px] border-border rounded-xl overflow-hidden',
        'transition-all duration-300',
        interactive ? 'cursor-pointer hover:-translate-y-2' : '',
        interactive
          ? '[box-shadow:4px_4px_0_var(--border)] hover:[box-shadow:6px_6px_0_var(--border)]'
          : '[box-shadow:4px_4px_0_var(--border)]',
      ].join(' ')}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!interactive) return
        if (e.key === 'Enter' || e.key === ' ') onClick?.()
      }}
    >
      <div className="relative w-full aspect-square">
        <div className="absolute inset-0" style={{ backgroundImage: gradient, backgroundSize: 'cover' }} />
        <div className="absolute inset-0 flex items-center justify-center select-none">
          <span className="text-[5rem] leading-none text-white/20 -rotate-12">♪</span>
        </div>

        {showImage && (
          <img
            src={src}
            alt=""
            className={[
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-200',
              imgLoaded ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgOk(false)}
            loading="lazy"
            decoding="async"
          />
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute bottom-3 left-3 right-3 z-10" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.55)' }}>
          <div className="text-lg font-extrabold text-white leading-tight">{artist.name}</div>
          <div className="text-sm font-semibold text-white/85">{artist.genre}</div>
        </div>
      </div>
    </div>
  )
}
