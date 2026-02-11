import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { type Artist } from './artist'
import { API_URL, resolveAssetUrl } from '@/lib/api'

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
  const [createArtistSeedId, setCreateArtistSeedId] = useState('')
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
    if (!open || !isCreate) {
      setCreateArtistSeedId('')
    }
  }, [open, isCreate])

  useEffect(() => {
    if (!isCreate || !createArtistSeedId) return
    const seed = artists.find((a) => a.id === createArtistSeedId)
    if (!seed) return
    setValue('name', seed.name ?? '', { shouldValidate: true })
    setValue('genre', seed.genre ?? '', { shouldValidate: true })
  }, [artists, createArtistSeedId, isCreate, setValue])

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

  const content = (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-8">
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-border text-foreground shadow-2xl admin-modal-surface"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div className="admin-modal-backdrop" style={{ backgroundColor: 'var(--background)' }} aria-hidden="true" />
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
            className="admin-modal-close rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-[var(--encore-accent-warm)] hover:bg-[var(--encore-accent-warm)] hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="px-6 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && <p className="text-xs text-red-400">{error}</p>}
          {success && <p className="text-xs text-emerald-400">{success}</p>}

          {isEdit && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-muted-foreground sm:col-span-2">
                  Select Artist
                  <select
                    value={selectedArtistId}
                    onChange={(event) => setSelectedArtistId(event.target.value)}
                    className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
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
                </label>
                <button
                  type="button"
                  onClick={handleLoadArtist}
                  className="rounded-md border-[3px] border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:brightness-105 sm:col-span-2"
                >
                  Load Artist
                </button>
              </div>
              <div className="border-t border-border my-4" />
            </>
          )}

          {isDelete && (
            <>
              <div className="grid gap-4">
                <label className="text-xs font-semibold text-muted-foreground">
                  Select Artist
                  <select
                    value={deleteArtistId}
                    onChange={(event) => setDeleteArtistId(event.target.value)}
                    className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
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
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  Type to confirm
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
                        ? `delete ${artists.find((a) => a.id === deleteArtistId)?.name ??
                        ''
                        }`
                        : 'delete artist-name'
                    }
                    className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    This permanently deletes the artist and all related albums and tracks.
                  </p>
                </label>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="rounded-md border-[3px] border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:brightness-105"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteArtist}
                  disabled={isSaving}
                  className="rounded-md border-[3px] border-border bg-red-600 px-4 py-2 text-xs font-extrabold text-white [box-shadow:3px_3px_0_var(--border)] hover:bg-red-700 disabled:opacity-60"
                >
                  {isSaving ? 'Deleting…' : 'Delete Artist'}
                </button>
              </div>
            </>
          )}

            {!isDelete && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {isCreate && (
                    <label className="text-xs font-semibold text-muted-foreground sm:col-span-2">
                      Artist Name (dropdown)
                      <select
                        value={createArtistSeedId}
                        onChange={(event) => setCreateArtistSeedId(event.target.value)}
                        className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                      >
                        <option value="">
                          {artistsLoading ? 'Loading artists…' : 'Choose an artist (optional)'}
                        </option>
                        {artists.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="text-xs font-semibold text-muted-foreground">
                    Name
                  <input
                    placeholder="Artist name"
                    {...register('name')}
                    className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.name.message}
                    </p>
                  )}
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  Genre
                  <input
                    placeholder="Genre"
                    {...register('genre')}
                    className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                  {errors.genre && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.genre.message}
                    </p>
                  )}
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  Artist Artwork
                  <label
                    className="mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground hover:border-[var(--encore-accent-cool)] hover:text-foreground"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDropFile(event, 'artwork')}
                  >
                    <span className="text-xs">Upload artist artwork</span>
                    <span className="rounded-md border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
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
                  {artworkFile && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {artworkFile.name}
                    </p>
                  )}
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  Preview Audio
                  <label
                    className="mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground hover:border-[var(--encore-accent-cool)] hover:text-foreground"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDropFile(event, 'preview')}
                  >
                    <span className="text-xs">Upload preview audio</span>
                    <span className="rounded-md border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
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
                  {previewFile && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {previewFile.name}
                    </p>
                  )}
                </label>
              </div>

              {isCreate && (
                <>
                  <div className="border-t border-border my-4" />
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={showBatchCreate}
                      onChange={(event) => setShowBatchCreate(event.target.checked)}
                      className="h-4 w-4 rounded border-border bg-background"
                    />
                    Create album and batch tracks now
                  </label>
                  {showBatchCreate && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Album Title
                        <input
                          placeholder="Album title"
                          value={albumTitle}
                          onChange={(event) => setAlbumTitle(event.target.value)}
                          className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                        />
                      </label>
                      <label className="text-xs font-semibold text-muted-foreground">
                        Release Date
                        <input
                          type="date"
                          value={albumReleaseDate}
                          onChange={(event) =>
                            setAlbumReleaseDate(event.target.value)
                          }
                          className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                        />
                      </label>
                      <label className="text-xs font-semibold text-muted-foreground sm:col-span-2">
                        Batch Tracks (one per line)
                        <textarea
                          rows={7}
                          placeholder="One track per line"
                          value={batchTracksText}
                          onChange={(event) => setBatchTracksText(event.target.value)}
                          className="mt-1 w-full resize-none rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                        />
                      </label>
                    </div>
                  )}
                </>
              )}

              {isEdit && createdArtistId && (
                <>
                  <div className="border-t border-border my-4" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Album Title
                      <input
                        placeholder="Album title"
                        value={albumTitle}
                        onChange={(event) => setAlbumTitle(event.target.value)}
                        className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                      />
                    </label>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Release Date
                      <input
                        type="date"
                        value={albumReleaseDate}
                        onChange={(event) => setAlbumReleaseDate(event.target.value)}
                        className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAlbum}
                    disabled={isSaving}
                    className="rounded-md border-[3px] border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:brightness-105"
                  >
                    {isSaving ? 'Saving...' : 'Add Album'}
                  </button>
                  {albums.length > 0 && (
                    <div className="space-y-3 mt-4">
                      {albums.map((album) => (
                        <AlbumCard key={album.id} album={album} />
                      ))}
                    </div>
                  )}

                  {albums.length > 0 && (
                    <>
                      <div className="border-t border-border my-4" />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs font-semibold text-muted-foreground sm:col-span-2">
                          Select Album
                          <select
                            value={selectedTrackAlbumId}
                            onChange={(event) =>
                              setSelectedTrackAlbumId(event.target.value)
                            }
                            className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
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
                        </label>
                        <label className="text-xs font-semibold text-muted-foreground">
                          Track Title
                          <input
                            placeholder="Track title"
                            value={trackTitle}
                            onChange={(event) => setTrackTitle(event.target.value)}
                            className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                          />
                        </label>
                        <label className="text-xs font-semibold text-muted-foreground">
                          Track Number
                          <input
                            placeholder="1"
                            value={trackNumber}
                            onChange={(event) => setTrackNumber(event.target.value)}
                            readOnly={!manualTrackNumber}
                            className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                          />
                        </label>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={manualTrackNumber}
                          onChange={(event) => {
                            setManualTrackNumber(event.target.checked)
                          }}
                          className="h-4 w-4 rounded border-border bg-background"
                        />
                        Manually set track number
                      </label>
                      <button
                        type="button"
                        onClick={handleAddTrack}
                        disabled={isSaving || !selectedTrackAlbumId}
                        className="rounded-md border-[3px] border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:brightness-105 disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Add Track'}
                      </button>
                    </>
                  )}
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-md border-[3px] border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:brightness-105"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleSubmit(
                    isEdit ? handleUpdateArtist : handleSaveArtist,
                  )}
                  disabled={isSaving}
                  className="rounded-md border-[3px] border-border bg-[var(--encore-accent-warm)] px-4 py-2 text-xs font-extrabold text-white [box-shadow:3px_3px_0_var(--border)] hover:-translate-y-0.5 transition-transform disabled:opacity-60"
                >
                  {isSaving
                    ? 'Saving...'
                    : isEdit
                      ? 'Update Artist'
                      : 'Create Artist'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return content
  return createPortal(content, document.body)
}
