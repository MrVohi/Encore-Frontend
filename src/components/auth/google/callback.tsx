import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { authService } from '../../../lib/api'

export default function GoogleCallback() {
  const navigate = useNavigate()
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
        navigate({ to: '/' })
      } catch (err: any) {
        setError(err.response?.data?.error || 'Google sign-in failed')
      }
    }

    handleCallback()
  }, [code, navigate])

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center bg-[#282c34]">
      <div className="bg-gray-800 p-8 rounded-lg shadow-md text-center">
        {error ? (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Signing you in...</h2>
            <p className="text-gray-400">Please wait</p>
          </div>
        )}
      </div>
    </div>
  )
}
