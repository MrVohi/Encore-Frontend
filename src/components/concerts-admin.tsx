import { useEffect, useMemo, useRef, useState } from 'react'
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
  const artistNameById = useMemo(() => {
    const map = new Map<string, string>()
    artists.forEach((a) => map.set(String(a.id), String(a.name)))
    return map
  }, [artists])
  const formRef = useRef<HTMLFormElement | null>(null)

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

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
    if (formRef.current && !formRef.current.reportValidity()) return
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (!form.artist_id.trim()) {
        throw new Error('Artist ID is required.')
      }

      const authHeader = getAuthHeader()
      const normalizedWhen = form.when
        ? form.when.replace('T', ' ').replace(/:00$/, ':00').replace(/:([0-9]{2})$/, ':$1:00')
        : form.when

      const res = await fetch(`${API_URL}/artists/${form.artist_id}/concerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
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
    if (formRef.current && !formRef.current.reportValidity()) return

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const authHeader = getAuthHeader()
      const normalizedWhen = form.when
        ? form.when
          .replace('T', ' ')
          .replace(/:([0-9]{2})$/, ':$1:00')
        : form.when

      const res = await fetch(`${API_URL}/concerts/${selectedConcertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader },
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
      const authHeader = getAuthHeader()
      const res = await fetch(`${API_URL}/concerts/${selectedConcertId}`, {
        method: 'DELETE',
        headers: authHeader,
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
            className="admin-modal-close rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-[var(--encore-accent-warm)] hover:bg-[var(--encore-accent-warm)] hover:text-white"
          >
            Close
          </button>
        </div>

        <form ref={formRef} className="px-6 py-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {success && <p className="text-xs text-emerald-400">{success}</p>}

          {isEdit && (
            <>
              <div className="grid gap-4">
                <label className="text-xs font-semibold text-muted-foreground">
                  Select Concert
                  <select
                    value={selectedConcertId}
                    onChange={(event) =>
                      setSelectedConcertId(event.target.value)
                    }
                    className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">
                      {concertsLoading
                        ? 'Loading concerts…'
                        : 'Choose a concert'}
                    </option>
                    {concerts.map((c) => {
                      const artistName = artistNameById.get(String(c.artist_id))
                      const label = [
                        artistName ? `${artistName}` : null,
                        c.city,
                        c.country,
                      ]
                        .filter(Boolean)
                        .join(' · ')
                      return (
                        <option key={c.id} value={c.id}>
                          {label}
                        </option>
                      )
                    })}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={handleLoadConcert}
                  className="rounded-md border-[3px] border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:brightness-105"
                >
                  Load Concert
                </button>
              </div>
              <div className="border-t border-border my-4" />
            </>
          )}

          {isDelete && (
            <>
              <div className="grid gap-4">
                <label className="text-xs font-semibold text-muted-foreground">
                  Select Concert
                  <select
                    value={selectedConcertId}
                    onChange={(event) =>
                      setSelectedConcertId(event.target.value)
                    }
                    className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">
                      {concertsLoading
                        ? 'Loading concerts…'
                        : 'Choose a concert'}
                    </option>
                    {concerts.map((c) => {
                      const artistName = artistNameById.get(String(c.artist_id))
                      const label = [
                        artistName ? `${artistName}` : null,
                        c.city,
                        c.country,
                      ]
                        .filter(Boolean)
                        .join(' · ')
                      return (
                        <option key={c.id} value={c.id}>
                          {label}
                        </option>
                      )
                    })}
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
                        handleDeleteConcert()
                      }
                    }}
                    placeholder={
                      selectedConcertId
                        ? `delete ${concerts.find((c) => c.id === selectedConcertId)
                          ?.city ?? ''
                        } ${concerts.find((c) => c.id === selectedConcertId)
                          ?.country ?? ''
                        } ${artists.find(
                          (a) =>
                            a.id ===
                            concerts.find(
                              (c) => c.id === selectedConcertId,
                            )?.artist_id,
                        )?.name ?? ''
                        }`
                        : 'delete city country artist'
                    }
                    className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    This permanently deletes the concert.
                  </p>
                </label>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border-[3px] border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:brightness-105"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConcert}
                  disabled={isSaving}
                  className="rounded-md border-[3px] border-border bg-red-600 px-4 py-2 text-xs font-extrabold text-white [box-shadow:3px_3px_0_var(--border)] hover:bg-red-700 disabled:opacity-60"
                >
                  {isSaving ? 'Deleting…' : 'Delete Concert'}
                </button>
              </div>
            </>
          )}

          {!isDelete && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Artist
                  <select
                    value={form.artist_id}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        artist_id: event.target.value,
                      }))
                    }
                    required
                    className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
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
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  When
                  <input
                    type="datetime-local"
                    value={form.when}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        when: event.target.value,
                      }))
                    }
                    required
                    className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  City
                  <input
                    value={form.city}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        city: event.target.value,
                      }))
                    }
                    required
                    className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  Country
                  <div className="mt-1">
                    <input
                      list="country-options"
                      value={form.country}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          country: event.target.value.toUpperCase(),
                        }))
                      }
                      required
                      placeholder="Type or choose"
                      className="w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                    <datalist id="country-options">
                      {countryOptions.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.label}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  {isGeocoding && (
                    <p className="mt-1 text-xs text-muted-foreground">Geocoding...</p>
                  )}
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  Capacity
                  <input
                    value={form.capacity}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        capacity: event.target.value,
                      }))
                    }
                    required
                    className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  Status
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        status: event.target.value,
                      }))
                    }
                    required
                    className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Choose a status</option>
                    <option value="on_sale">On Sale</option>
                    <option value="sold_out">Sold Out</option>
                    <option value="ended">Event Ended</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="postponed">Postponed</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  Latitude
                  <input
                    value={form.lat}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        lat: event.target.value,
                      }))
                    }
                    required
                    className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  Longitude
                  <input
                    value={form.lng}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        lng: event.target.value,
                      }))
                    }
                    required
                    className="mt-1 w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-md border-[3px] border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:brightness-105"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={isEdit ? handleUpdateConcert : handleCreateConcert}
                  disabled={isSaving}
                  className="rounded-md border-[3px] border-border bg-[var(--encore-accent-warm)] px-4 py-2 text-xs font-extrabold text-white [box-shadow:3px_3px_0_var(--border)] hover:-translate-y-0.5 transition-transform disabled:opacity-60"
                >
                  {isSaving
                    ? 'Saving...'
                    : isEdit
                      ? 'Update Concert'
                      : 'Create Concert'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return content
  return createPortal(content, document.body)
}
