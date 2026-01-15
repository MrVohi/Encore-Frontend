import type { Artist } from '@/types/artist'
import type { Album } from '@/types/album'
import { AlbumCard } from '@/features/albums/components/AlbumCard'

export default function ArtistBackCard({
  artist,
  albums,
  albumsLoading,
  albumsError,
}: {
  artist: Artist
  albums: Album[]
  albumsLoading: boolean
  albumsError: string | null
}) {
  return (
    <div className="relative w-full h-full overflow-visible">
      <div
        className={[
          'relative z-10 w-full h-full',
          'bg-card text-card-foreground',
          'border-[3px] border-border rounded-xl overflow-hidden',
          '[box-shadow:4px_4px_0_var(--border)]',
          'flex flex-col',
        ].join(' ')}
      >
        <div className="p-4 border-b-[3px] border-border">
          <div className="text-lg font-extrabold leading-tight">{artist.name}</div>
          <div className="text-sm font-semibold text-muted-foreground">{artist.genre}</div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          <div>
            <div className="text-sm font-semibold text-muted-foreground mb-2">Albums</div>

            {albumsLoading && <div className="text-sm text-muted-foreground">Loading albums…</div>}
            {albumsError && <div className="text-sm text-red-300">Error: {albumsError}</div>}

            {!albumsLoading && !albumsError && (
              <div className="space-y-2">
                {albums?.length ? (
                  albums.map((a) => <AlbumCard key={a.id} album={a} />)
                ) : (
                  <div className="text-sm text-muted-foreground">No albums</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
