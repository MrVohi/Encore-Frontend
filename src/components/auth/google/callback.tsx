import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { authService } from '../../../lib/api'
import { useAuth } from '../../../integrations/auth-context'

export default function GoogleCallback() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [error, setError] = useState('')

  // Read the code from the URL
  const searchParams = new URLSearchParams(window.location.search)
  const code = searchParams.get('code')

  useEffect(() => {
    const handleCallback = async () => {
      if (!code) {
        setError('Missing code')
        return
      }

      try {
        const response = await authService.googleCallback(code)
        localStorage.setItem('access_token', response.access_token)
        localStorage.setItem('refresh_token', response.refresh_token)
        localStorage.setItem('user', JSON.stringify(response.user))
        authService.setAccessToken(response.access_token)
        await refreshUser()
        navigate({ to: '/' })
      } catch (err: any) {
        setError(err.response?.data?.error || 'Google sign-in failed')
      }
    }

    handleCallback()
  }, [code, navigate])

  return (
    <div className="pt-0 min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="bg-card p-8 rounded-xl border-[3px] border-border [box-shadow:4px_4px_0_var(--border)] text-center">
        {error ? (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Signing you in...</h2>
            <p className="text-muted-foreground">Please wait</p>
          </div>
        )}
      </div>
    </div>
  )
}
