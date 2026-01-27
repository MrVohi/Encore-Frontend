import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { Route as LoginRoute } from '../../routes/login'
import { useAuth } from '../../integrations/auth-context'
import ReCAPTCHA from 'react-google-recaptcha'

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
  })
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleRecaptcha = (token: string | null) => {
    setRecaptchaToken(token)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (!recaptchaToken) {
      setError('Veuillez compléter le reCAPTCHA')
      return
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setLoading(true)

    try {
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        recaptcha_token: recaptchaToken,
      })

      navigate({ to: '/' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center bg-[#282c34] py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-white">
            Inscription
          </h2>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-300">
                  Prénom
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-300">
                  Nom
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                Nom d’utilisateur
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md"
              />
            </div>


            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <ReCAPTCHA
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''}
              onChange={handleRecaptcha}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? 'Inscription...' : "S'inscrire"}
            </button>
          </div>
        </form>

        <div className="text-center">
          <Link to={LoginRoute.to} className="text-sm text-cyan-400 hover:text-cyan-300">
            Déjà un compte ? Se connecter
          </Link>
        </div>
      </div>
    </div>
  )
}