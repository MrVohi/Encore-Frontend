import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Route as LoginRoute } from '../../routes/login'
import { authService } from '../../lib/api'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      await authService.requestPasswordReset(email)
      setMessage('If this email exists, a reset link has been sent.')
      setEmail('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-0 min-h-screen flex items-center justify-center bg-background text-foreground py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-xl border-[3px] border-border [box-shadow:4px_4px_0_var(--border)]">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-foreground">
            Forgot your password
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your email address and we will send you a password reset link.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/10 border border-red-700/40 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-4 py-3 rounded">
            {message}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-background border-[3px] border-border text-foreground rounded-md shadow-sm focus:outline-none focus:ring-0"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border-[3px] border-border rounded-md shadow-sm text-sm font-extrabold text-white bg-[var(--encore-accent-warm)] hover:brightness-110 focus:outline-none disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <Link to={LoginRoute.to} className="text-sm text-[var(--encore-accent-warm)] hover:brightness-110">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
