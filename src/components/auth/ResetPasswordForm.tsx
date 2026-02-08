import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Route as LoginRoute } from '../../routes/login'
import { authService } from '../../lib/api'

export default function ResetPasswordForm() {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Read the token from the URL
  const searchParams = new URLSearchParams(window.location.search)
  const token = searchParams.get('token')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!token) {
      setError('Invalid token')
      return
    }

    setLoading(true)

    try {
      await authService.resetPassword(token, formData.newPassword)
      alert('Password reset successfully!')
      navigate({ to: LoginRoute.to })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="artists-encore min-h-screen text-foreground flex items-start justify-center overflow-x-hidden pt-0 py-12 px-4">
      <div className="artists-vignette" aria-hidden="true" />
      <div className="relative z-10 max-w-md w-full space-y-8 bg-card p-8 rounded-xl border-[3px] border-border [box-shadow:4px_4px_0_var(--border)]">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-foreground">
            Reset your password
          </h2>
        </div>

        {error && (
          <div className="bg-red-900/10 border border-red-700/40 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-muted-foreground">
                New password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
                value={formData.newPassword}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-background border-[3px] border-border text-foreground rounded-md shadow-sm focus:outline-none focus:ring-0"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-background border-[3px] border-border text-foreground rounded-md shadow-sm focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border-[3px] border-border rounded-md shadow-sm text-sm font-extrabold text-white bg-[var(--encore-accent-warm)] hover:brightness-110 focus:outline-none disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
