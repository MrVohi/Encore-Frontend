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
  const { register, googleLogin } = useAuth()
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
      setError('Passwords do not match')
      return
    }

    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
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

      localStorage.removeItem('email_verified_at')
      localStorage.setItem('pending_verification_email', formData.email)
      navigate({ to: '/verify-email' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await googleLogin()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="artists-encore min-h-screen text-foreground flex items-start justify-center overflow-x-hidden pt-0 pb-16 px-4">
      <div className="artists-vignette" aria-hidden="true" />
      <div className="relative z-10 mt-6 max-w-md w-full space-y-8 bg-card p-8 rounded-xl border-[3px] border-border [box-shadow:4px_4px_0_var(--border)]">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-foreground">
            Sign up
          </h2>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-muted-foreground">
                  First name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-background border-[3px] border-border text-foreground rounded-md shadow-sm focus:outline-none focus:ring-0"
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-muted-foreground">
                  Last name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-background border-[3px] border-border text-foreground rounded-md shadow-sm focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-muted-foreground">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-background border-[3px] border-border text-foreground rounded-md"
              />
            </div>


            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-background border-[3px] border-border text-foreground rounded-md shadow-sm focus:outline-none focus:ring-0"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                value={formData.password}
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
              className="w-full flex justify-center py-2 px-4 border-[3px] border-border rounded-md shadow-sm text-sm font-extrabold text-white bg-[var(--encore-accent-warm)] hover:brightness-110 focus:outline-none disabled:opacity-50"
            >
              {loading ? 'Signing up...' : 'Sign up'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">OR</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="mt-4 w-full flex justify-center items-center py-2 px-4 border-[3px] border-border rounded-md shadow-sm bg-secondary text-sm font-semibold text-foreground hover:brightness-105"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </button>
        </div>

        <div className="text-center">
          <Link to={LoginRoute.to} className="text-sm text-[var(--encore-accent-warm)] hover:brightness-110">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
