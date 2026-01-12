import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../../lib/api';

const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');

      if (!code) {
        setError('Code manquant');
        return;
      }

      try {
        const response = await authService.googleCallback(code);
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erreur de connexion Google');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        {error ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h2>
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connexion en cours...</h2>
            <p className="text-gray-600">Veuillez patienter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;