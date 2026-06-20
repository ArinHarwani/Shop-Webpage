import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import * as DS from '../../services/DataService';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAdmin();
  const navigate = useNavigate();
  const settings = DS.getSettings();

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (login(password)) {
        navigate('/admin/dashboard');
      } else {
        setError('Incorrect password. Please try again.');
        setIsLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative bg-white rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-500/30">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{settings.shopName || 'DressMirror'}</h1>
          <p className="text-gray-500 mt-1">Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="admin-password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter admin password"
              className="input-field"
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium animate-slide-up">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password}
            className="btn-primary w-full"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-400 hover:text-brand-600 transition-colors">
            ← Back to Customer Portal
          </a>
        </div>
      </div>
    </div>
  );
}
