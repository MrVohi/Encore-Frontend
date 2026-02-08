import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { API_URL } from '@/lib/api'

type Concert = {
  id: string
  artist_id: string
  when: string
  city: string
  country: string
  capacity: number
  status: string
  created_at: string
  lat: number
  lng: number
}

type ConcertAdminMode = 'create' | 'edit' | 'delete'

export function ConcertAdminModal({
  open,
  onClose,
  mode,
}: {
  open: boolean
  onClose: () => void
  mode: ConcertAdminMode
}) {
  const isCreate = mode === 'create'
  const isEdit = mode === 'edit'
  const isDelete = mode === 'delete'

  const [concerts, setConcerts] = useState<Concert[]>([])
  const [concertsLoading, setConcertsLoading] = useState(false)
  const [artists, setArtists] = useState<{ id: string; name: string }[]>([])
  const [artistsLoading, setArtistsLoading] = useState(false)
  const [selectedConcertId, setSelectedConcertId] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    artist_id: '',
    when: '',
    city: '',
    country: '',
    capacity: '',
    status: '',
    lat: '',
    lng: '',
  })

  const countryOptions = [
    { code: 'US', label: 'United States' },
    { code: 'CA', label: 'Canada' },
    { code: 'GB', label: 'United Kingdom' },
    { code: 'FR', label: 'France' },
    { code: 'DE', label: 'Germany' },
    { code: 'ES', label: 'Spain' },
    { code: 'IT', label: 'Italy' },
    { code: 'NL', label: 'Netherlands' },
    { code: 'BE', label: 'Belgium' },
    { code: 'CH', label: 'Switzerland' },
    { code: 'PT', label: 'Portugal' },
    { code: 'IE', label: 'Ireland' },
    { code: 'SE', label: 'Sweden' },
    { code: 'NO', label: 'Norway' },
    { code: 'DK', label: 'Denmark' },
    { code: 'FI', label: 'Finland' },
    { code: 'PL', label: 'Poland' },
    { code: 'AT', label: 'Austria' },
    { code: 'CZ', label: 'Czechia' },
    { code: 'HU', label: 'Hungary' },
  ]

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()

    const loadConcerts = async () => {
      setConcertsLoading(true)
      setError(null)

      try {
        const res = await fetch(`${API_URL}/concerts`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Failed to load concerts')
        const json = await res.json()
        setConcerts(Array.isArray(json) ? (json as Concert[]) : [])
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setConcerts([])
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setConcertsLoading(false)
      }
    }

    const loadArtists = async () => {
      setArtistsLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_URL}/artists`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Failed to load artists')
        const json = await res.json()
        setArtists(
          Array.isArray(json)
            ? (json as { id: string; name: string }[])
            : [],
        )
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setArtists([])
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setArtistsLoading(false)
      }
    }

    if (!isCreate) loadConcerts()
    loadArtists()
    return () => controller.abort()
  }, [API_URL, isCreate, open])

  const handleReset = () => {
    setForm({
      artist_id: '',
      when: '',
      city: '',
      country: '',
      capacity: '',
      status: '',
      lat: '',
      lng: '',
    })
    setSelectedConcertId('')
    setDeleteConfirm('')
    setError(null)
    setSuccess(null)
  }

  const handleLoadConcert = async () => {
    if (!selectedConcertId) {
      setError('Select a concert to load.')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`${API_URL}/concerts/${selectedConcertId}`)
      if (!res.ok) throw new Error('Failed to load concert')
      const selected = (await res.json()) as Concert

      setForm({
        artist_id: selected.artist_id ?? '',
        when: selected.when ?? '',
        city: selected.city ?? '',
        country: selected.country ?? '',
        capacity: String(selected.capacity ?? ''),
        status: selected.status ?? '',
        lat: String(selected.lat ?? ''),
        lng: String(selected.lng ?? ''),
      })
      setSuccess('Concert loaded for editing.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleGeocode = async () => {
    if (!form.city.trim() || !form.country.trim()) {
      setError('City and country are required to geocode.')
      return
    }

    setIsGeocoding(true)
    setError(null)
    setSuccess(null)

    try {
      const query = encodeURIComponent(`${form.city}, ${form.country}`)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
      )
      if (!res.ok) throw new Error('Failed to geocode location')
      const json = await res.json()
      const hit = Array.isArray(json) ? json[0] : null
      if (!hit) throw new Error('No results found for that location')

      setForm((prev) => ({
        ...prev,
        lat: String(hit.lat),
        lng: String(hit.lon),
      }))
      setSuccess('Found location')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGeocoding(false)
    }
  }

  useEffect(() => {
    if (!form.city.trim() || !form.country.trim()) return
    const handle = window.setTimeout(() => {
      handleGeocode()
    }, 600)
    return () => window.clearTimeout(handle)
  }, [form.city, form.country])

  if (!open) return null

  const handleCreateConcert = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (!form.artist_id.trim()) {
        throw new Error('Artist ID is required.')
      }

      const normalizedWhen = form.when
        ? form.when.replace('T', ' ').replace(/:00$/, ':00').replace(/:([0-9]{2})$/, ':$1:00')
        : form.when

      const res = await fetch(`${API_URL}/artists/${form.artist_id}/concerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          when: normalizedWhen,
          city: form.city,
          country: form.country,
          capacity: Number(form.capacity),
          status: form.status,
          lat: Number(form.lat),
          lng: Number(form.lng),
        }),
      })

      if (!res.ok) throw new Error('Failed to create concert')
      setSuccess('Concert created successfully.')
      handleReset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateConcert = async () => {
    if (!selectedConcertId) {
      setError('Select a concert to update.')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const normalizedWhen = form.when
        ? form.when
            .replace('T', ' ')
            .replace(/:([0-9]{2})$/, ':$1:00')
        : form.when

      const res = await fetch(`${API_URL}/concerts/${selectedConcertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          when: normalizedWhen,
          city: form.city,
          country: form.country,
          capacity: Number(form.capacity),
          status: form.status,
          lat: Number(form.lat),
          lng: Number(form.lng),
        }),
      })

      if (!res.ok) throw new Error('Failed to update concert')
      setSuccess('Concert updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteConcert = async () => {
    if (!selectedConcertId) {
      setError('Select a concert to delete.')
      return
    }

    const selected = concerts.find((c) => c.id === selectedConcertId)
    const artistName =
      artists.find((a) => a.id === selected?.artist_id)?.name ?? ''
    const confirmText = selected
      ? `delete ${selected.city} ${selected.country} ${artistName}`.trim()
      : ''

    if (deleteConfirm.trim().toLowerCase() !== confirmText.toLowerCase()) {
      setError('Type the confirmation phrase exactly to delete.')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`${API_URL}/concerts/${selectedConcertId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete concert')
      setSuccess('Concert deleted successfully.')
      setConcerts((prev) => prev.filter((c) => c.id !== selectedConcertId))
      setSelectedConcertId('')
      setDeleteConfirm('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSaving(false)
    }
  }

  const content = (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="relative w-full max-w-4xl rounded-2xl border border-border bg-card text-foreground shadow-2xl admin-modal-surface">
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Admin
            </p>
            <h2 className="text-xl font-semibold text-foreground">
              {isCreate
                ? 'Create Concert'
                : isEdit
                  ? 'Edit Concert'
                  : 'Delete Concert'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isCreate
                ? 'Schedule a new concert.'
                : isEdit
                  ? 'Load a concert and update details.'
                  : 'Permanently remove a concert.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground hover:border-border hover:bg-secondary"
          >
            Close
          </button>
        </div>

        <div className="mx-auto max-w-2xl px-6 py-6 max-h-[80vh] overflow-y-auto">
          <section className="space-y-4">
            {isEdit && (
              <div className="rounded-xl border border-border bg-secondary p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Edit Existing Concert
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Load for editing
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Select Concert
                    </label>
                    <select
                      value={selectedConcertId}
                      onChange={(event) =>
                        setSelectedConcertId(event.target.value)
                      }
                      className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                    >
                      <option value="">
                        {concertsLoading
                          ? 'Loading concerts…'
                          : 'Choose a concert'}
                      </option>
                      {concerts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.city} · {c.country}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadConcert}
                    className="rounded-md border border-border bg-card px-4 py-2 text-xs text-muted-foreground hover:border-border hover:bg-secondary"
                  >
                    Load Concert
                  </button>
                </div>
              </div>
            )}

            {isDelete && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-red-700">
                    Delete Concert
                  </h3>
                  <span className="text-xs text-red-300">
                    Removes related tickets
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-red-300">
                      Select Concert
                    </label>
                    <select
                      value={selectedConcertId}
                      onChange={(event) =>
                        setSelectedConcertId(event.target.value)
                      }
                      className="mt-2 w-full rounded-md border border-destructive/40 bg-card px-3 py-2 text-sm text-foreground focus:border-red-400 focus:outline-none"
                    >
                      <option value="">
                        {concertsLoading
                          ? 'Loading concerts…'
                          : 'Choose a concert'}
                      </option>
                      {concerts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.city} · {c.country}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-red-300">
                      Type to confirm
                    </label>
                    <input
                      value={deleteConfirm}
                      onChange={(event) => setDeleteConfirm(event.target.value)}
                      placeholder={
                        selectedConcertId
                          ? `delete ${
                              concerts.find((c) => c.id === selectedConcertId)
                                ?.city ?? ''
                            } ${
                              concerts.find((c) => c.id === selectedConcertId)
                                ?.country ?? ''
                            } ${
                              artists.find(
                                (a) =>
                                  a.id ===
                                  concerts.find(
                                    (c) => c.id === selectedConcertId,
                                  )?.artist_id,
                              )?.name ?? ''
                            }`
                          : 'delete city country artist'
                      }
                      className="mt-2 w-full rounded-md border border-destructive/40 bg-card px-3 py-2 text-sm text-foreground placeholder:text-red-300/50 focus:border-red-400 focus:outline-none"
                    />
                    <div className="mt-1 text-xs text-red-300/70">
                      <p>This permanently deletes the concert.</p>
                      {selectedConcertId && (
                        <p className="mt-1 text-red-700">
                          {concerts.find((c) => c.id === selectedConcertId)?.city}{' '}
                          {concerts.find((c) => c.id === selectedConcertId)
                            ?.country}{' '}
                          ·{' '}
                          {artists.find(
                            (a) =>
                              a.id ===
                              concerts.find((c) => c.id === selectedConcertId)
                                ?.artist_id,
                          )?.name ?? 'Unknown artist'}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteConcert}
                    disabled={isSaving}
                    className="rounded-md bg-destructive px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                  >
                    {isSaving ? 'Deleting…' : 'Delete Concert'}
                  </button>
                </div>
              </div>
            )}

            {!isDelete && (
              <div className="rounded-xl border border-border bg-secondary p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Concert Details
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {isEdit
                      ? 'GET /api/concerts/:id'
                      : 'POST /api/artists/:id/concerts'}
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">
                        City
                      </label>
                      <input
                        value={form.city}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            city: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Country
                      </label>
                      <div className="mt-2">
                        <input
                          list="country-options"
                          value={form.country}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              country: event.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="Start typing or choose country"
                          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                        />
                        <datalist id="country-options">
                          {countryOptions.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.label}
                            </option>
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isGeocoding && ' Geocoding...'}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">
                        When
                      </label>
                      <input
                        type="datetime-local"
                        value={form.when}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            when: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Status
                      </label>
                      <select
                        value={form.status}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            status: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                      >
                        <option value="">Choose a status</option>
                        <option value="on_sale">On Sale</option>
                        <option value="sold_out">Sold Out</option>
                        <option value="ended">Event Ended</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="postponed">Postponed</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Capacity
                      </label>
                      <input
                        value={form.capacity}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            capacity: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Artist
                      </label>
                      <select
                        value={form.artist_id}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            artist_id: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                      >
                        <option value="">
                          {artistsLoading ? 'Loading artists…' : 'Choose an artist'}
                        </option>
                        {artists.map((artist) => (
                          <option key={artist.id} value={artist.id}>
                            {artist.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Latitude
                      </label>
                      <input
                        value={form.lat}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            lat: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Longitude
                      </label>
                      <input
                        value={form.lng}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            lng: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-[var(--encore-accent-cool)] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={isEdit ? handleUpdateConcert : handleCreateConcert}
                    disabled={isSaving}
                    className="rounded-md bg-[var(--encore-accent-cool)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                  >
                    {isSaving
                      ? 'Saving...'
                      : isEdit
                        ? 'Update Concert'
                        : 'Create Concert'}
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
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return content
  return createPortal(content, document.body)
}
