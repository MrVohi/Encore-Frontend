import type { Album } from '@/types/album'

export function AlbumCard({ album }: { album: Album }) {
  const release = album.release_date ? new Date(album.release_date).toLocaleDateString() : 'Unknown'

  return (
    <div className="bg-secondary rounded-lg p-3 w-full border border-border/30">
      <div className="font-semibold">{album.title}</div>
      <div className="text-sm opacity-70">{release}</div>

      <div className="mt-2 text-sm opacity-80">
        <div className="opacity-60 mb-1">Tracks:</div>

        <div className="max-h-32 overflow-auto space-y-1 pr-1">
          {album.tracks?.length ? (
            album.tracks.map((t) => (
              <div key={t.id} className="flex gap-2">
                <span className="opacity-60 w-6 text-right">{t.track_no}</span>
                <span>{t.title}</span>
              </div>
            ))
          ) : (
            <div className="opacity-60">No tracks</div>
          )}
        </div>
      </div>
    </div>
  )
}
