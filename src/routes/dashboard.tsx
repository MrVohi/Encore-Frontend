import React from 'react';
import { useAuth } from '../integrations/auth-context';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Tableau de bord</h1>
        <p className="text-xl text-gray-600 mb-8">
          Bienvenue, {user?.first_name} {user?.last_name} !
        </p>

        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="text-lg font-semibold mb-4">Informations du compte</h2>
          <div className="space-y-2">
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>Provider:</strong> {user?.provider}
            </p>
            <p>
              <strong>Email vérifié:</strong>{' '}
              {user?.is_email_verified ? (
                <span className="text-green-600 font-semibold">Oui ✓</span>
              ) : (
                <span className="text-red-600 font-semibold">Non ✗</span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}