import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Route as LoginRoute } from '../../routes/login'
import { authService } from '../../lib/api'

export default function VerifyEmail() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  // Récupérer le token depuis l'URL
  const searchParams = new URLSearchParams(window.location.search)
  const token = searchParams.get('token')

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Token manquant')
        return
      }

      try {
        await authService.verifyEmail(token)
        setStatus('success')
        setMessage('E-mail vérifié avec succès !')
      } catch (err: any) {
        setStatus('error')
        setMessage(err.response?.data?.error || 'Échec de la vérification')
      }
    }

    verify()
  }, [token])

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center bg-[#282c34] py-12 px-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-md text-center">
        <h2 className="text-3xl font-extrabold text-white mb-6">
          Vérification de l'e-mail
        </h2>

        {status === 'loading' && (
          <p className="text-gray-400">Vérification en cours...</p>
        )}

        {status === 'success' && (
          <div>
            <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded mb-6">
              {message}
            </div>
            <Link
              to={LoginRoute.to}
              className="inline-block px-6 py-3 bg-cyan-600 text-white rounded-md hover:bg-cyan-700"
            >
              Se connecter
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
              {message}
            </div>
            <Link
              to={LoginRoute.to}
              className="inline-block px-6 py-3 bg-cyan-600 text-white rounded-md hover:bg-cyan-700"
            >
              Retour à l'inscription
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}