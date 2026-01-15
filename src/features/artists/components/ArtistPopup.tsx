import { useEffect, useState } from 'react'
import type { Artist } from '@/types/artist'
import ArtistCard from './ArtistCard'
import ArtistBackCard from './ArtistBackCard'
import { VinylDisc } from '@/components/ui/vinyl'
import useArtistAlbums from '../hooks/useArtistAlbums'

export default function ArtistPopup({
  artist,
  open,
  onClose,
}: {
  artist: Artist | null
  open: boolean
  onClose: () => void
}) {
  const [returned, setReturned] = useState(false)
  const [vinylOut, setVinylOut] = useState(false)

  const { albums, loading: albumsLoading, error: albumsError } = useArtistAlbums(artist?.id ?? null)

  const [mounted, setMounted] = useState(false)
  const [show, setShow] = useState(false)
  const [renderArtist, setRenderArtist] = useState<Artist | null>(null)

  const showVinyl = albums.length > 0

  useEffect(() => {
    if (open && artist) setRenderArtist(artist)
  }, [open, artist])

  useEffect(() => {
    if (open && artist) {
      setMounted(true)
      setReturned(false)
      setVinylOut(false)
      requestAnimationFrame(() => setShow(true))
      return
    }

    setShow(false)
    const t = setTimeout(() => {
      setMounted(false)
      setRenderArtist(null)
    }, 200)
    return () => clearTimeout(t)
  }, [open, artist])

  useEffect(() => {
    if (!mounted) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mounted, onClose])

  if (!mounted || !renderArtist) return null

  const tab =
    'bg-secondary text-foreground border-[3px] border-border px-3 py-1.5 text-sm font-extrabold ' +
    '[box-shadow:3px_3px_0_var(--border)] hover:-translate-y-0.5 transition-transform'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        className={[
          'absolute inset-0 bg-black/60 transition-opacity duration-200 ease-out',
          show ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        onClick={onClose}
        aria-label="Close"
      />

      <div
        className={[
          'relative z-10 transition-all duration-200 ease-out',
          show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-[0.98]',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-[min(92vw,420px)] aspect-square">
          <button
            className={`${tab} absolute -top-5 left-5 rounded-b-md rounded-t-md -rotate-1`}
            onClick={() => {
              setVinylOut(false)
              setReturned((v) => !v)
            }}
          >
            {returned ? 'FRONT' : 'BACK'}
          </button>

          <button className={`${tab} absolute -top-5 right-5 rounded-b-md rounded-t-md rotate-1`} onClick={onClose}>
            CLOSE
          </button>

          <div className="h-full w-full pt-3">
            <div className="relative w-full h-full overflow-visible">
              {showVinyl && (
                <VinylDisc visible={returned} out={returned ? vinylOut : false} onToggle={() => setVinylOut((v) => !v)} />
              )}

              {/* Sleeve (single div) with a circular notch cut on the right */}
              <div
                className={[
                  "relative z-10 w-full h-full",
                  "text-card-foreground",
                  "rounded-xl overflow-hidden",
                  "flex flex-col",
                ].join(" ")}
                style={{
                  WebkitMaskImage:
                    "radial-gradient(circle 34px at calc(100% + 18px) 50%, rgba(0,0,0,0) 0 34px, rgba(0,0,0,1) 35px)",
                  maskImage:
                    "radial-gradient(circle 34px at calc(100% + 18px) 50%, rgba(0,0,0,0) 0 34px, rgba(0,0,0,1) 35px)",
                }}
              >

                <div className={['absolute inset-0 z-10', returned ? 'pointer-events-auto' : 'pointer-events-none'].join(' ')}>
                  <ArtistBackCard artist={renderArtist} albums={albums} albumsLoading={albumsLoading} albumsError={albumsError} />
                </div>

              </div>

              <div
                className={['absolute inset-0 z-20 transition-opacity ease-out duration-200', returned ? 'opacity-0 pointer-events-none' : 'opacity-100'].join(' ')}
                style={{ transitionDelay: returned ? '0ms' : '180ms' }}
              >
                <ArtistCard artist={renderArtist} index={0} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
