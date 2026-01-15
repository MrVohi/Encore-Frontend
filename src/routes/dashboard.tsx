import { useAuth } from '../integrations/auth-context'
import { Route as LoginRoute } from './login'
import { useNavigate } from '@tanstack/react-router'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate({ to: LoginRoute.to })
  }

  if (!user) {
    return null
  }

  return (
    <div className="pt-16 min-h-screen bg-[#282c34] text-white py-12 px-4">
      <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4">Tableau de bord</h1>
        <p className="text-xl text-gray-300 mb-8">
          Bienvenue, {user.first_name} {user.last_name} !
        </p>

        <div className="bg-gray-900 p-6 rounded-lg mb-8">
          <h2 className="text-lg font-semibold mb-4">Informations du compte</h2>
          <div className="space-y-2">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Provider:</strong> {user.provider}
            </p>
            <p>
              <strong>Email vérifié:</strong>{' '}
              {user.is_email_verified ? (
                <span className="text-green-400 font-semibold">Oui ✓</span>
              ) : (
                <span className="text-red-400 font-semibold">Non ✗</span>
              )}
            </p>
            <p className="text-sm text-gray-400 mt-4">
              Membre depuis: {new Date(user.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold transition-colors"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  )
}