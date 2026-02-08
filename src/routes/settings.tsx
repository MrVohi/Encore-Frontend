import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../integrations/auth-context'
import { API_ORIGIN, authService } from '../lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'

export const Route = createFileRoute('/settings')({
  component: Settings,
})

function Settings() {
  const { user, refreshUser } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  })
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  useEffect(() => {
    if (!user) return
    setProfileForm({
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
    })
  }, [user])

  const initials = useMemo(() => {
    if (!user) return 'U'
    const first = user.first_name?.trim()?.[0] || ''
    const last = user.last_name?.trim()?.[0] || ''
    if (first || last) return (first + last).toUpperCase()
    if (user.username) return user.username.trim().slice(0, 2).toUpperCase()
    if (user.email) return user.email.trim().slice(0, 2).toUpperCase()
    return 'U'
  }, [user])

  const avatarUrl = useMemo(() => {
    if (!user?.avatar_url) return undefined
    if (user.avatar_url.startsWith('http')) return user.avatar_url
    return `${API_ORIGIN}${user.avatar_url}`
  }, [user])

  if (!user) {
    return (
      <div className="pt-0 pb-16 min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-xl">Please sign in to access settings.</div>
      </div>
    )
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!selectedFile) {
      setError('Please choose an image to upload.')
      return
    }

    setSaving(true)
    try {
      await authService.uploadAvatar(selectedFile)
      await refreshUser()
      setMessage('Profile photo updated.')
      setSelectedFile(null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAvatar = async () => {
    setMessage('')
    setError('')
    setSaving(true)
    try {
      await authService.deleteAvatar()
      await refreshUser()
      setMessage('Profile photo removed.')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMessage('')
    setProfileError('')
    setProfileSaving(true)
    try {
      await authService.updateProfile({
        username: profileForm.username,
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
      })
      await refreshUser()
      setProfileMessage('Profile updated.')
    } catch (err: any) {
      setProfileError(err.response?.data?.error || 'Update failed')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage('')
    setPasswordError('')

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('Passwords do not match')
      return
    }

    setPasswordSaving(true)
    try {
      await authService.changePassword(passwordForm.current_password, passwordForm.new_password)
      setPasswordMessage('Password updated.')
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Password update failed')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="relative pt-0 pb-16 min-h-screen bg-background text-foreground px-4">
      <div className="absolute inset-x-0 top-16 h-40 bg-gradient-to-b from-muted/60 to-transparent pointer-events-none z-0" />
      <div className="relative z-10 max-w-4xl mx-auto p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and account preferences.</p>
        </div>

        <section className="rounded-2xl bg-card p-6 shadow-md border border-border">
          <h2 className="text-lg font-semibold mb-4">Profile photo</h2>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl} alt={user.email} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <form onSubmit={handleUpload} className="flex flex-1 flex-col gap-3">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-foreground hover:file:brightness-105"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-md border-[3px] border-border bg-[var(--encore-accent-warm)] px-4 py-2 text-sm font-extrabold text-white hover:brightness-110 disabled:opacity-50"
                >
                  {saving ? 'Uploading...' : 'Upload photo'}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-md border-[3px] border-border bg-secondary px-4 py-2 text-sm font-semibold text-foreground hover:brightness-105 disabled:opacity-50"
                >
                  Remove photo
                </button>
                <span className="text-xs text-muted-foreground">PNG, JPG, or WEBP up to 5MB.</span>
              </div>
              {message && (
                <div className="rounded-md border border-green-700 bg-green-900/40 px-3 py-2 text-sm text-green-200">
                  {message}
                </div>
              )}
              {error && (
                <div className="rounded-md border border-red-700 bg-red-900/40 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}
            </form>
          </div>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-md border border-border">
          <h2 className="text-lg font-semibold mb-4">Account details</h2>
          <form onSubmit={handleProfileSave} className="space-y-4 text-sm text-muted-foreground">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-1" htmlFor="first_name">
                  First name
                </label>
                <input
                  id="first_name"
                  type="text"
                  value={profileForm.first_name}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, first_name: event.target.value }))}
                  className="w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1" htmlFor="last_name">
                  Last name
                </label>
                <input
                  id="last_name"
                  type="text"
                  value={profileForm.last_name}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, last_name: event.target.value }))}
                  className="w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={profileForm.username}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, username: event.target.value }))}
                className="w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Email</span>
              <span>{user.email}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Email verified</span>
              <span>{user.is_email_verified ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={profileSaving}
                className="inline-flex items-center justify-center rounded-md border-[3px] border-border bg-[var(--encore-accent-warm)] px-4 py-2 text-sm font-extrabold text-white hover:brightness-110 disabled:opacity-50"
              >
                {profileSaving ? 'Saving...' : 'Save changes'}
              </button>
              {profileMessage && (
                <span className="text-sm text-green-300">{profileMessage}</span>
              )}
              {profileError && (
                <span className="text-sm text-red-300">{profileError}</span>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-md border border-border">
          <h2 className="text-lg font-semibold mb-4">Change password</h2>
          {user.provider === 'google' ? (
            <p className="text-sm text-muted-foreground">
              Password changes are not available for Google accounts.
            </p>
          ) : (
            <form onSubmit={handlePasswordSave} className="space-y-4 text-sm text-muted-foreground">
              <div>
                <label className="block text-xs text-muted-foreground mb-1" htmlFor="current_password">
                  Current password
                </label>
                <input
                  id="current_password"
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({ ...prev, current_password: event.target.value }))
                  }
                  className="w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1" htmlFor="new_password">
                    New password
                  </label>
                  <input
                    id="new_password"
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))
                    }
                    className="w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1" htmlFor="confirm_password">
                    Confirm password
                  </label>
                  <input
                    id="confirm_password"
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({ ...prev, confirm_password: event.target.value }))
                    }
                    className="w-full rounded-md border-[3px] border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="inline-flex items-center justify-center rounded-md border-[3px] border-border bg-[var(--encore-accent-warm)] px-4 py-2 text-sm font-extrabold text-white hover:brightness-110 disabled:opacity-50"
                >
                  {passwordSaving ? 'Updating...' : 'Update password'}
                </button>
                {passwordMessage && (
                  <span className="text-sm text-green-300">{passwordMessage}</span>
                )}
                {passwordError && (
                  <span className="text-sm text-red-300">{passwordError}</span>
                )}
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
