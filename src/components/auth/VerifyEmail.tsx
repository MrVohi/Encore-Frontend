import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../lib/api';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token manquant');
        return;
      }

      try {
        await authService.verifyEmail(token);
        setStatus('success');
        setMessage('E-mail vérifié avec succès !');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Échec de la vérification');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6">
          Vérification de l'e-mail
        </h2>

        {status === 'loading' && (
          <p className="text-gray-600">Vérification en cours...</p>
        )}

        {status === 'success' && (
          <div>
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-6">
              {message}
            </div>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Se connecter
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
              {message}
            </div>
            <Link
              to="/register"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retour à l'inscription
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;