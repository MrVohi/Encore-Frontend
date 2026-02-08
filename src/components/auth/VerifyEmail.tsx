import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Route as LoginRoute } from '../../routes/login'
import { authService } from '../../lib/api'

export default function VerifyEmail() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'awaiting'>('loading')
  const [message, setMessage] = useState('')
  const didVerify = useRef(false)
  const [email, setEmail] = useState('')
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [resendMessage, setResendMessage] = useState('')
  const navigate = useNavigate()

  const searchParams = new URLSearchParams(window.location.search)
  const token = searchParams.get('token')
  const emailFromQuery = searchParams.get('email') || ''
  const storedEmail = localStorage.getItem('pending_verification_email') || ''
  const verifiedAt = localStorage.getItem('email_verified_at') || ''

  useEffect(() => {
    if (didVerify.current) return
    didVerify.current = true

    const verify = async () => {
      if (!token) {
        if (verifiedAt) {
          navigate({ to: '/' })
          return
        }
        setStatus('awaiting')
        setMessage('A verification email has been sent. Please check your inbox.')
        if (emailFromQuery) {
          setEmail(emailFromQuery)
        } else if (storedEmail) {
          setEmail(storedEmail)
        }
        return
      }

      try {
        await authService.verifyEmail(token)
        setStatus('success')
        setMessage('Email verified successfully!')
        localStorage.removeItem('pending_verification_email')
        localStorage.setItem('email_verified_at', String(Date.now()))
        setTimeout(() => {
          navigate({ to: '/' })
        }, 1500)
      } catch (err: any) {
        setStatus('error')
        setMessage(err.response?.data?.error || 'Verification failed')
      }
    }

    verify()
  }, [token, emailFromQuery, navigate, storedEmail, verifiedAt])

  useEffect(() => {
    if (status !== 'awaiting') return

    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'email_verified_at') return
      if (!event.newValue) return
      setStatus('success')
      setMessage('Email verified successfully!')
      localStorage.removeItem('pending_verification_email')
      navigate({ to: '/' })
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [navigate, status])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    setResendStatus('loading')
    setResendMessage('')

    try {
      await authService.resendVerification(email)
      setResendStatus('success')
      setResendMessage('If this email exists, a link has been sent.')
    } catch (err: any) {
      setResendStatus('error')
      setResendMessage(err.response?.data?.error || 'Failed to send email')
    }
  }

  return (
    <div className="artists-encore min-h-screen text-foreground flex items-start justify-center overflow-x-hidden pt-0 pb-16 px-4">
      <div className="artists-vignette" aria-hidden="true" />
      <div className="relative z-10 mt-6 max-w-md w-full bg-card p-8 rounded-xl border-[3px] border-border [box-shadow:4px_4px_0_var(--border)] text-center">
        <h2 className="text-3xl font-extrabold text-foreground mb-6">
          Email Verification
        </h2>

        {status === 'loading' && (
          <p className="text-muted-foreground">Verifying...</p>
        )}

        {status === 'success' && (
          <div>
            <div className="border border-[color-mix(in_oklab,var(--encore-accent-warm)_55%,var(--border))] bg-[color-mix(in_oklab,var(--encore-accent-warm)_12%,var(--card))] text-foreground px-4 py-3 rounded mb-6">
              {message}
            </div>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md border-[3px] border-border bg-[var(--encore-accent-warm)] px-6 py-3 text-sm font-extrabold text-white hover:brightness-110"
            >
              Continue
            </Link>
          </div>
        )}

        {status === 'awaiting' && (
          <div>
            <div className="border border-[color-mix(in_oklab,var(--encore-accent-warm)_55%,var(--border))] bg-[color-mix(in_oklab,var(--encore-accent-warm)_12%,var(--card))] text-foreground px-4 py-3 rounded mb-6">
              {message}
            </div>

            <form onSubmit={handleResend} className="space-y-4 text-left">
              <label className="block text-sm font-medium text-muted-foreground" htmlFor="email">
                Resend verification email
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
              <button
                type="submit"
                disabled={resendStatus === 'loading'}
                className="w-full flex justify-center py-2 px-4 border-[3px] border-border rounded-md shadow-sm text-sm font-extrabold text-white bg-[var(--encore-accent-warm)] hover:brightness-110 focus:outline-none disabled:opacity-50"
              >
                {resendStatus === 'loading' ? 'Sending...' : 'Resend'}
              </button>
              {resendMessage && (
                <div
                  className={
                    resendStatus === 'success'
                      ? 'border border-[color-mix(in_oklab,var(--encore-accent-warm)_55%,var(--border))] bg-[color-mix(in_oklab,var(--encore-accent-warm)_12%,var(--card))] text-foreground px-4 py-3 rounded'
                      : 'border border-red-700 bg-red-900/30 text-red-200 px-4 py-3 rounded'
                  }
                >
                  {resendMessage}
                </div>
              )}
            </form>

            <div className="mt-6">
              <Link
                to={LoginRoute.to}
                className="inline-flex items-center justify-center rounded-md border-[3px] border-border bg-secondary px-6 py-3 text-sm font-semibold text-foreground hover:brightness-105"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="border border-red-700 bg-red-900/30 text-red-200 px-4 py-3 rounded mb-6">
              {message}
            </div>

            <form onSubmit={handleResend} className="space-y-4 text-left">
              <label className="block text-sm font-medium text-muted-foreground" htmlFor="email">
                Resend verification email
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
              <button
                type="submit"
                disabled={resendStatus === 'loading'}
                className="w-full flex justify-center py-2 px-4 border-[3px] border-border rounded-md shadow-sm text-sm font-extrabold text-white bg-[var(--encore-accent-warm)] hover:brightness-110 focus:outline-none disabled:opacity-50"
              >
                {resendStatus === 'loading' ? 'Sending...' : 'Resend'}
              </button>
              {resendMessage && (
                <div
                  className={
                    resendStatus === 'success'
                      ? 'border border-[color-mix(in_oklab,var(--encore-accent-warm)_55%,var(--border))] bg-[color-mix(in_oklab,var(--encore-accent-warm)_12%,var(--card))] text-foreground px-4 py-3 rounded'
                      : 'border border-red-700 bg-red-900/30 text-red-200 px-4 py-3 rounded'
                  }
                >
                  {resendMessage}
                </div>
              )}
            </form>

            <div className="mt-6">
              <Link
                to={LoginRoute.to}
                className="inline-flex items-center justify-center rounded-md border-[3px] border-border bg-secondary px-6 py-3 text-sm font-semibold text-foreground hover:brightness-105"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
