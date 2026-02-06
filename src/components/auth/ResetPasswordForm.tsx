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
    <div className="pt-16 min-h-screen flex items-center justify-center bg-[#282c34] py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-white">
            Reset your password
          </h2>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">
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
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Confirm password
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

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
