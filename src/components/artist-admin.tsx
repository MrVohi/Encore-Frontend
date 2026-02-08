import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { type Artist } from './artist'
import { API_URL } from '@/lib/api'

type Track = {
  id: string
  title: string
  track_no: string
  album_id: string
  created_at: string
}

type Album = {
  id: string
  title: string
  release_date: string
  artist_id: string
  created_at: string
  tracks: Track[]
}

function AlbumCard({ album }: { album: Album }) {
  const release = album.release_date
    ? new Date(album.release_date).toLocaleDateString()
    : 'Unknown'

  return (
    <div className="bg-white/5 rounded-lg p-3 w-full">
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

type ArtistAdminMode = 'create' | 'edit' | 'delete'

export function ArtistAdminModal({
  artist,
  open,
  onClose,
  mode,
}: {
  artist: Artist | null
  open: boolean
  onClose: () => void
  mode: ArtistAdminMode
}) {
  const isCreate = mode === 'create'
  const isEdit = mode === 'edit'
  const isDelete = mode === 'delete'
  const headerTitle = isCreate
    ? 'Create Artist'
    : isEdit
      ? 'Edit Artist'
      : 'Delete Artist'
  const headerSubtitle = isCreate
    ? 'Add a new artist to the catalog.'
    : isEdit
      ? 'Load an artist and update details.'
      : 'Permanently remove an artist and related data.'
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [createdArtistId, setCreatedArtistId] = useState<string | null>(null)
  const [createdAlbumId, setCreatedAlbumId] = useState<string | null>(null)
  const [albumTitle, setAlbumTitle] = useState('')
  const [albumReleaseDate, setAlbumReleaseDate] = useState('')
  const [trackTitle, setTrackTitle] = useState('')
  const [trackNumber, setTrackNumber] = useState('')
  const [manualTrackNumber, setManualTrackNumber] = useState(false)
  const [trackInputMode, setTrackInputMode] = useState<'batch' | 'single'>(
    'single',
  )
  const [batchTracksText, setBatchTracksText] = useState('')
  const [showBatchCreate, setShowBatchCreate] = useState(false)
  const [selectedTrackAlbumId, setSelectedTrackAlbumId] = useState('')
  const [albums, setAlbums] = useState<Album[]>([])
  const [albumsLoading, setAlbumsLoading] = useState(false)
  const [tracks, setTracks] = useState<Album['tracks']>([])
  const [tracksLoading, setTracksLoading] = useState(false)
  const [showAlbums, setShowAlbums] = useState(true)
  const [showTracks, setShowTracks] = useState(true)
  const [artists, setArtists] = useState<Artist[]>([])
  const [artistsLoading, setArtistsLoading] = useState(false)
  const [selectedArtistId, setSelectedArtistId] = useState('')
  const [deleteArtistId, setDeleteArtistId] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const artistSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    genre: z.string().min(1, 'Genre is required'),
    artworkFile: z.instanceof(File).nullable(),
    previewFile: z.instanceof(File).nullable(),
  })

  type ArtistForm = z.infer<typeof artistSchema>

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ArtistForm>({
    resolver: zodResolver(artistSchema),
    defaultValues: {
      name: '',
      genre: '',
      artworkFile: null,
      previewFile: null,
    },
  })

  const artworkFile = watch('artworkFile')
  const previewFile = watch('previewFile')
  const watchedName = watch('name')
  const watchedGenre = watch('genre')
  const [artworkPreviewUrl, setArtworkPreviewUrl] = useState<string | null>(
    null,
  )

  useEffect(() => {
    if (!artworkFile) {
      setArtworkPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(artworkFile)
    setArtworkPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [artworkFile])

  useEffect(() => {
    if (!open || !artist) return

    const ac = new AbortController()

    return () => ac.abort()
  }, [open, artist?.id])

  useEffect(() => {
    if (!open) return
    setTrackInputMode(isCreate ? 'batch' : 'single')
  }, [isCreate, open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()

    const loadArtists = async () => {
      setArtistsLoading(true)
      setError(null)

      try {
        const res = await fetch(`${API_URL}/artists`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Failed to load artists')
        const json = await res.json()
        setArtists(Array.isArray(json) ? (json as Artist[]) : [])
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setArtists([])
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setArtistsLoading(false)
      }
    }

    loadArtists()
    return () => controller.abort()
  }, [API_URL, open])

  useEffect(() => {
    if (!open) return
    const artistId = createdArtistId ?? artist?.id
    if (!artistId) return

    const controller = new AbortController()

    loadAlbumsForArtist(artistId, controller.signal)
    return () => controller.abort()
  }, [API_URL, artist?.id, createdArtistId, open])

  useEffect(() => {
    if (!open) return
    if (!selectedTrackAlbumId) {
      setTracks([])
      return
    }

    const controller = new AbortController()
    loadTracksForAlbum(selectedTrackAlbumId, controller.signal)
    return () => controller.abort()
  }, [API_URL, open, selectedTrackAlbumId])

  useEffect(() => {
    if (manualTrackNumber) return

    if (!selectedTrackAlbumId) {
      setTrackNumber('')
      return
    }

    if (!tracks.length) {
      setTrackNumber('1')
      return
    }

    const maxNo = Math.max(
      ...tracks.map((t) => Number(t.track_no)).filter((n) => Number.isFinite(n)),
    )
    setTrackNumber(Number.isFinite(maxNo) ? String(maxNo + 1) : '1')
  }, [manualTrackNumber, selectedTrackAlbumId, tracks])

  if (!open) return null

  const handleReset = () => {
    reset({
      name: '',
      genre: '',
      artworkFile: null,
      previewFile: null,
    })
    setSelectedArtistId('')
    setDeleteArtistId('')
    setDeleteConfirm('')
    setCreatedArtistId(null)
    setCreatedAlbumId(null)
    setAlbumTitle('')
    setAlbumReleaseDate('')
    setTrackTitle('')
    setTrackNumber('')
    setManualTrackNumber(false)
    setTrackInputMode(isCreate ? 'batch' : 'single')
    setBatchTracksText('')
    setShowBatchCreate(false)
    setSelectedTrackAlbumId('')
    setTracks([])
    setShowAlbums(true)
    setShowTracks(true)
    setError(null)
    setSuccess(null)
  }

  const handleDropFile = (
    event: React.DragEvent<HTMLLabelElement>,
    kind: 'artwork' | 'preview',
  ) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0] ?? null
    setValue(kind === 'artwork' ? 'artworkFile' : 'previewFile', file, {
      shouldValidate: true,
    })
  }

  const loadAlbumsForArtist = async (
    artistId: string,
    signal?: AbortSignal,
  ) => {
    setAlbumsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/artists/${artistId}/albums`, {
        signal,
      })
      if (!res.ok) throw new Error('Failed to load albums')
      const baseAlbums = await res.json()
      const list = Array.isArray(baseAlbums) ? (baseAlbums as Album[]) : []
      const albumsWithTracks = await Promise.all(
        list.map(async (album) => {
          try {
            const trackRes = await fetch(`${API_URL}/albums/${album.id}/tracks`, {
              signal,
            })
            if (!trackRes.ok) return { ...album, tracks: [] }
            const tracksJson = await trackRes.json()
            return {
              ...album,
              tracks: Array.isArray(tracksJson) ? tracksJson : [],
            }
          } catch {
            return { ...album, tracks: [] }
          }
        }),
      )
      setAlbums(albumsWithTracks)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setAlbums([])
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setAlbumsLoading(false)
    }
  }

  const loadTracksForAlbum = async (
    albumId: string,
    signal?: AbortSignal,
  ) => {
    setTracksLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/albums/${albumId}/tracks`, {
        signal,
      })
      if (!res.ok) throw new Error('Failed to load tracks')
      const json = await res.json()
      setTracks(Array.isArray(json) ? (json as Album['tracks']) : [])
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setTracks([])
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setTracksLoading(false)
    }
  }

  const handleSaveArtist = async (data: ArtistForm) => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const authHeader = getAuthHeader()
      const createRes = await fetch(`${API_URL}/artists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          name: data.name,
          genre: data.genre,
        }),
      })

      if (!createRes.ok) {
        throw new Error('Failed to create artist')
      }

      const created: Artist = await createRes.json()
      setCreatedArtistId(created.id)

      if (data.artworkFile) {
        const artworkData = new FormData()
        artworkData.append('file', data.artworkFile)

        const artworkRes = await fetch(
          `${API_URL}/artists/${created.id}/artwork`,
          {
            method: 'POST',
            headers: authHeader,
            body: artworkData,
          },
        )

        if (!artworkRes.ok) {
          throw new Error('Failed to upload artwork')
        }
      }

      if (data.previewFile) {
        const previewData = new FormData()
        previewData.append('file', data.previewFile)

        const previewRes = await fetch(
          `${API_URL}/artists/${created.id}/preview`,
          {
            method: 'POST',
            headers: authHeader,
            body: previewData,
          },
        )

        if (!previewRes.ok) {
          throw new Error('Failed to upload preview')
        }
      }

      if (albumTitle.trim()) {
        const albumRes = await fetch(
          `${API_URL}/artists/${created.id}/albums`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader },
            body: JSON.stringify({
              title: albumTitle,
              release_date: albumReleaseDate,
            }),
          },
        )
        if (!albumRes.ok) throw new Error('Failed to create album')
        const album = await albumRes.json()

        const lines = batchTracksText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)

        if (lines.length) {
          let trackNo = 1
          for (const title of lines) {
            const trackRes = await fetch(
              `${API_URL}/albums/${album.id}/tracks`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeader },
                body: JSON.stringify({
                  title,
                  track_no: trackNo,
                }),
              },
            )
            if (!trackRes.ok) {
              throw new Error(`Failed to create track: ${title}`)
            }
            trackNo += 1
          }
        }
      }

      setSuccess('Artist created successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateArtist = async (data: ArtistForm) => {
    if (!selectedArtistId) {
      setError('Select an artist to update.')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const authHeader = getAuthHeader()
      const updateRes = await fetch(`${API_URL}/artists/${selectedArtistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          name: data.name,
          genre: data.genre,
        }),
      })

      if (!updateRes.ok) {
        throw new Error('Failed to update artist')
      }

      if (data.artworkFile) {
        const artworkData = new FormData()
        artworkData.append('file', data.artworkFile)
        const artworkRes = await fetch(
          `${API_URL}/artists/${selectedArtistId}/artwork`,
          {
            method: 'POST',
            headers: authHeader,
            body: artworkData,
          },
        )
        if (!artworkRes.ok) {
          throw new Error('Failed to upload artwork')
        }
      }

      if (data.previewFile) {
        const previewData = new FormData()
        previewData.append('file', data.previewFile)
        const previewRes = await fetch(
          `${API_URL}/artists/${selectedArtistId}/preview`,
          {
            method: 'POST',
            headers: authHeader,
            body: previewData,
          },
        )
        if (!previewRes.ok) {
          throw new Error('Failed to upload preview')
        }
      }

      setSuccess('Artist updated successfully.')
      setCreatedArtistId(selectedArtistId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoadArtist = () => {
    const selected = artists.find((a) => a.id === selectedArtistId)
    if (!selected) {
      setError('Select an artist to load.')
      return
    }

    setValue('artworkFile', null, { shouldValidate: true })
    setValue('previewFile', null, { shouldValidate: true })
    setValue('name', selected.name, { shouldValidate: true })
    setValue('genre', selected.genre, { shouldValidate: true })
    setCreatedArtistId(selected.id)
    setSuccess('Artist loaded for editing.')
    setError(null)
  }

  const handleDeleteArtist = async () => {
    if (!deleteArtistId) {
      setError('Select an artist to delete.')
      return
    }

    const selected = artists.find((a) => a.id === deleteArtistId)
    const confirmText = selected ? `delete ${selected.name}` : ''

    if (deleteConfirm.trim().toLowerCase() !== confirmText.toLowerCase()) {
      setError('Type the confirmation phrase exactly to delete.')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const authHeader = getAuthHeader()
      const res = await fetch(`${API_URL}/artists/${deleteArtistId}`, {
        method: 'DELETE',
        headers: authHeader,
      })

      if (!res.ok) {
        throw new Error('Failed to delete artist')
      }

      setSuccess('Artist deleted successfully.')
      setArtists((prev) => prev.filter((a) => a.id !== deleteArtistId))
      setDeleteArtistId('')
      setDeleteConfirm('')
      if (createdArtistId === deleteArtistId) {
        setCreatedArtistId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddAlbum = async () => {
    if (!createdArtistId) {
      setError('Create an artist first.')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const authHeader = getAuthHeader()
      const res = await fetch(`${API_URL}/artists/${createdArtistId}/albums`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          title: albumTitle,
          release_date: albumReleaseDate,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create album')
      }

      const album = await res.json()
      setCreatedAlbumId(album.id ?? null)
      setSelectedTrackAlbumId(album.id ?? '')
      await loadAlbumsForArtist(createdArtistId)
      setSuccess('Album created successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddTrack = async () => {
    const albumId = selectedTrackAlbumId || createdAlbumId
    if (!createdArtistId || !albumId) {
      setError('Select an album before adding tracks.')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const authHeader = getAuthHeader()
      const trackNo = Number(trackNumber)
      const res = await fetch(`${API_URL}/albums/${albumId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          title: trackTitle,
          track_no: Number.isFinite(trackNo) && trackNo > 0 ? trackNo : 1,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create track')
      }

      await loadTracksForAlbum(albumId)
      if (createdArtistId) {
        await loadAlbumsForArtist(createdArtistId)
      }
      setSuccess('Track created successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSaving(false)
    }
  }

  // I keep artist bec I'm unsure if I'll need it (as admin will have to enter everything manually)
  // What we need to post for artist: name, genre, image_url, and a small song preview. It is on /api/artists
  // but for each artist, we will need their albums!
  // It is also manual, and we need title & release_date. It will be on /api/{artist_id}/albums
  // But what is an album without tracks?
  // We need to post for each track: title and track number (unique). It will be on /api/{artist_id}/albums/{album_id}/tracks
  const content = (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="relative w-full max-w-4xl rounded-2xl border border-border bg-[color-mix(in_oklab,var(--theme-paper)_92%,var(--background))] text-foreground shadow-2xl admin-modal-surface">
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Admin
            </p>
            <h2 className="text-xl font-semibold text-foreground">{headerTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{headerSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground hover:border-border hover:bg-secondary"
          >
            Close
          </button>
        </div>

        <div
          className={[
            'px-6 py-6',
            'grid gap-6 md:grid-cols-[1.1fr_0.9fr]',
            'max-h-[80vh] overflow-y-auto',
          ].join(' ')}
        >
          <section className="space-y-4">
            {isEdit && (
              <div className="rounded-xl border border-border bg-secondary p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Edit Existing Artist
                </h3>
                <span className="text-xs text-muted-foreground">
                  Load for editing
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Select Artist
                  </label>
                  <select
                    value={selectedArtistId}
                    onChange={(event) => setSelectedArtistId(event.target.value)}
                    className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                  >
                    <option value="">
                      {artistsLoading ? 'Loading artists…' : 'Choose an artist'}
                    </option>
                    {artists.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleLoadArtist}
                  className="rounded-md border border-border bg-card px-4 py-2 text-xs text-muted-foreground hover:border-border hover:bg-secondary"
                >
                  Load Artist
                </button>
                {selectedArtistId && (
                  <p className="text-xs text-muted-foreground">
                    Selected ID: {selectedArtistId}
                  </p>
                )}
              </div>
            </div>
            )}

            {isDelete && (
              <div
                className="rounded-xl border border-destructive/40 bg-secondary p-4"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleDeleteArtist()
                  }
                }}
              >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-red-700">
                  Delete Artist
                </h3>
                <span className="text-xs text-muted-foreground">
                  Removes albums & tracks
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Select Artist
                  </label>
                  <select
                    value={deleteArtistId}
                    onChange={(event) => setDeleteArtistId(event.target.value)}
                    className="mt-2 w-full rounded-md border border-destructive/40 bg-[color-mix(in_oklab,var(--card)_82%,var(--background))] px-3 py-2 text-sm text-foreground focus:border-red-400 focus:outline-none"
                  >
                    <option value="">
                      {artistsLoading ? 'Loading artists…' : 'Choose an artist'}
                    </option>
                    {artists.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Type to confirm
                  </label>
                  <input
                    value={deleteConfirm}
                    onChange={(event) => setDeleteConfirm(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleDeleteArtist()
                      }
                    }}
                    placeholder={
                      deleteArtistId
                        ? `delete ${
                            artists.find((a) => a.id === deleteArtistId)?.name ??
                            ''
                          }`
                        : 'delete artist-name'
                    }
                    className="mt-2 w-full rounded-md border border-destructive/40 bg-[color-mix(in_oklab,var(--card)_82%,var(--background))] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-red-400 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    This permanently deletes the artist and all related albums
                    and tracks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteArtist}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-md border-[3px] border-border bg-red-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-red-700 w-full mt-2"
                >
                  {isSaving ? 'Deleting…' : 'Delete Artist'}
                </button>
              </div>
            </div>
            )}

            {!isDelete && (
              <div className="rounded-xl border border-border bg-secondary p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Artist Details
                </h3>
                <span className="text-xs text-muted-foreground">
                  {isEdit ? 'PUT /api/artists/:id' : 'POST /api/artists'}
                </span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Name
                    </label>
                    <input
                      placeholder="Artist name"
                      {...register('name')}
                      className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Genre
                    </label>
                    <input
                      placeholder="Genre"
                      {...register('genre')}
                      className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                    />
                    {errors.genre && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.genre.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Preview Audio
                    </label>
                    <label
                      className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground hover:border-[var(--encore-accent-cool)] hover:text-foreground"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => handleDropFile(event, 'preview')}
                    >
                      <span className="text-xs uppercase tracking-widest text-muted-foreground">
                        Drag & drop
                      </span>
                      <span className="text-sm text-foreground">
                        Upload preview audio
                      </span>
                      <span className="rounded-md border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
                        Choose file
                      </span>
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(event) =>
                          setValue(
                            'previewFile',
                            event.target.files?.[0] ?? null,
                            { shouldValidate: true },
                          )
                        }
                      />
                    </label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Upload a short preview clip (mp3, wav).
                    </p>
                    {previewFile && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Selected: {previewFile.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Artist Artwork
                    </label>
                    <label
                      className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground hover:border-[var(--encore-accent-cool)] hover:text-foreground"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => handleDropFile(event, 'artwork')}
                    >
                      <span className="text-xs uppercase tracking-widest text-muted-foreground">
                        Drag & drop
                      </span>
                      <span className="text-sm text-foreground">
                        Upload artist artwork
                      </span>
                      <span className="rounded-md border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
                        Choose file
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) =>
                          setValue(
                            'artworkFile',
                            event.target.files?.[0] ?? null,
                            { shouldValidate: true },
                          )
                        }
                      />
                    </label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Upload square cover art (jpg, png).
                    </p>
                    {artworkFile && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Selected: {artworkFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSubmit(
                    isEdit ? handleUpdateArtist : handleSaveArtist,
                  )}
                  disabled={isSaving}
                  className="rounded-md bg-[var(--encore-accent-cool)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                >
                  {isSaving
                    ? 'Saving...'
                    : isEdit
                      ? 'Update Artist'
                      : 'Save Artist'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-md border border-border bg-card px-4 py-2 text-xs text-muted-foreground hover:border-border hover:bg-secondary"
                >
                  Reset Form
                </button>
              </div>
              {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
              {success && (
                <p className="mt-3 text-xs text-emerald-400">{success}</p>
              )}
            </div>
            )}
          </section>

          <section className="space-y-4">
          {isEdit && (
          <div className="rounded-xl border border-border bg-secondary p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Albums For Artist
                </h3>
                <span className="text-xs text-muted-foreground">
                  POST /api/{'{artist_id}'}/albums
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Album Title
                  </label>
                  <input
                    placeholder="Album title"
                    value={albumTitle}
                    onChange={(event) => setAlbumTitle(event.target.value)}
                    className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Release Date
                  </label>
                  <input
                    type="date"
                    value={albumReleaseDate}
                    onChange={(event) => setAlbumReleaseDate(event.target.value)}
                    className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAddAlbum}
                  disabled={isSaving}
                  className="rounded-md bg-[var(--encore-accent-cool)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                >
                  {isSaving ? 'Saving...' : 'Add Album'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAlbums((prev) => !prev)}
                  className="rounded-md border border-border bg-card px-4 py-2 text-xs text-muted-foreground hover:border-border hover:bg-secondary"
                >
                  {showAlbums ? 'Hide Albums' : 'Show Albums'}
                </button>
              </div>
              {showAlbums && (
                <div className="mt-4 space-y-3">
                  {albumsLoading && (
                    <p className="text-xs text-muted-foreground">Loading albums…</p>
                  )}
                  {!albumsLoading && albums.length === 0 && (
                    <p className="text-xs text-muted-foreground">No albums yet.</p>
                  )}
                  {!albumsLoading &&
                    albums.map((album) => (
                      <AlbumCard key={album.id} album={album} />
                    ))}
                </div>
              )}
            </div>
            )}
            {isEdit && (
            <div className="rounded-xl border border-border bg-secondary p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Tracks For Album
                </h3>
                <span className="text-xs text-muted-foreground">
                  POST /api/albums/{'{album_id}'}/tracks
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Select Album
                  </label>
                  <select
                    value={selectedTrackAlbumId}
                    onChange={(event) =>
                      setSelectedTrackAlbumId(event.target.value)
                    }
                    className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                  >
                    <option value="">
                      {albumsLoading ? 'Loading albums…' : 'Choose an album'}
                    </option>
                    {albums.map((album) => (
                      <option key={album.id} value={album.id}>
                        {album.title}
                      </option>
                    ))}
                  </select>
                  {selectedTrackAlbumId && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Selected:{' '}
                      {albums.find((a) => a.id === selectedTrackAlbumId)?.title ??
                        ''}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Track Title
                  </label>
                  <input
                    placeholder="Track title"
                    value={trackTitle}
                    onChange={(event) => setTrackTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleAddTrack()
                      }
                    }}
                    className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Track Number
                  </label>
                  <input
                    placeholder="1"
                    value={trackNumber}
                    onChange={(event) => setTrackNumber(event.target.value)}
                    readOnly={!manualTrackNumber}
                    className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {manualTrackNumber
                      ? 'Manual override enabled.'
                      : 'Auto-assigned based on existing tracks.'}
                  </p>
                  <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={manualTrackNumber}
                      onChange={(event) => {
                        setManualTrackNumber(event.target.checked)
                      }}
                      className="h-4 w-4 rounded border-border bg-secondary text-[var(--encore-accent-cool)] focus:ring-[var(--encore-accent-cool)]"
                    />
                    Manually set track number
                  </label>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAddTrack}
                  disabled={isSaving || !selectedTrackAlbumId}
                  className="rounded-md bg-[var(--encore-accent-cool)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                >
                  {isSaving ? 'Saving...' : 'Add Track'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTracks((prev) => !prev)}
                  className="rounded-md border border-border bg-card px-4 py-2 text-xs text-muted-foreground hover:border-border hover:bg-secondary"
                >
                  {showTracks ? 'Hide Tracks' : 'Show Tracks'}
                </button>
              </div>
              {showTracks && (
                <div className="mt-4 space-y-2 text-sm">
                  {tracksLoading && (
                    <p className="text-xs text-muted-foreground">Loading tracks…</p>
                  )}
                  {!tracksLoading && tracks.length === 0 && (
                    <p className="text-xs text-muted-foreground">No tracks yet.</p>
                  )}
                  {!tracksLoading &&
                    tracks.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between rounded-md border border-border/60 bg-card/60 px-3 py-2"
                      >
                        <span className="text-foreground">{track.title}</span>
                        <span className="text-xs text-muted-foreground">
                          #{track.track_no}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
            )}

            {isEdit && (
              <div className="rounded-xl border border-dashed border-border/80 bg-secondary/60 p-4 text-center">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Selected Artist Preview
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {(() => {
                    const selected = artists.find(
                      (a) => a.id === selectedArtistId,
                    )
                    if (selected) return `${selected.name} · ${selected.genre}`
                    if (watchedName || watchedGenre) {
                      return `${watchedName || 'Untitled'} · ${
                        watchedGenre || 'Unknown'
                      }`
                    }
                    return 'No artist selected'
                  })()}
                </p>
                {(() => {
                  const selected = artists.find(
                    (a) => a.id === selectedArtistId,
                  )
                  const existingArtwork =
                    selected?.artwork_url ?? selected?.image_url ?? ''
                  const previewSrc = artworkPreviewUrl || existingArtwork
                  if (!previewSrc) return null
                  return (
                    <img
                      src={previewSrc}
                      alt="Artist artwork preview"
                      className="mx-auto mt-3 h-28 w-28 rounded-lg object-cover"
                    />
                  )
                })()}
                <p className="mt-2 text-xs text-muted-foreground">
                  Drop in artwork and preview URLs to see it here.
                </p>
              </div>
            )}

            {isCreate && (
              <div className="rounded-xl border border-border bg-secondary p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Optional Album + Batch Tracks
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    POST /api/artists/:id/albums + tracks
                  </span>
                </div>
                <label className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={showBatchCreate}
                    onChange={(event) => setShowBatchCreate(event.target.checked)}
                    className="h-4 w-4 rounded border-border bg-secondary text-[var(--encore-accent-cool)] focus:ring-[var(--encore-accent-cool)]"
                  />
                  Create album and batch tracks now
                </label>
                {showBatchCreate && (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Album Title
                    </label>
                    <input
                      placeholder="Album title"
                      value={albumTitle}
                      onChange={(event) => setAlbumTitle(event.target.value)}
                      className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Release Date
                    </label>
                    <input
                      type="date"
                      value={albumReleaseDate}
                      onChange={(event) =>
                        setAlbumReleaseDate(event.target.value)
                      }
                      className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Batch Tracks
                    </label>
                    <textarea
                      rows={7}
                      placeholder="One track per line"
                      value={batchTracksText}
                      onChange={(event) => setBatchTracksText(event.target.value)}
                      className="mt-2 w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none min-h-[180px]"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tracks will be numbered from 1 in order.
                    </p>
                  </div>
                </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return content
  return createPortal(content, document.body)
}
