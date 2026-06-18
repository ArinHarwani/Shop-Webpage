import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as DS from '../services/DataService';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const stored = localStorage.getItem('dm_admin_session');
    if (!stored) return false;
    try {
      const { expiry } = JSON.parse(stored);
      return new Date(expiry) > new Date();
    } catch {
      return false;
    }
  });
  const [isLocked, setIsLocked] = useState(false);
  const lockTimer = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const resetLockTimer = useCallback(() => {
    if (lockTimer.current) clearTimeout(lockTimer.current);
    if (isAuthenticated && !isLocked) {
      lockTimer.current = setTimeout(() => {
        setIsLocked(true);
      }, 2 * 60 * 1000); // 2 minutes
    }
  }, [isAuthenticated, isLocked]);

  // Auto-lock timer on admin pages
  useEffect(() => {
    if (!location.pathname.startsWith('/admin')) return;
    if (!isAuthenticated) return;

    resetLockTimer();
    const events = ['click', 'touchstart', 'keydown', 'scroll', 'mousemove'];
    const handler = () => {
      if (isLocked) return;
      resetLockTimer();
    };
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (lockTimer.current) clearTimeout(lockTimer.current);
    };
  }, [isAuthenticated, isLocked, location.pathname, resetLockTimer]);

  // Check session expiry on load
  useEffect(() => {
    const stored = localStorage.getItem('dm_admin_session');
    if (stored) {
      try {
        const { expiry } = JSON.parse(stored);
        if (new Date(expiry) <= new Date()) {
          logout();
        }
      } catch {
        logout();
      }
    }
  }, []);

  const login = useCallback((password) => {
    const settings = DS.getSettings();
    if (password === settings.adminPassword) {
      const expiry = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); // 8 hours
      localStorage.setItem('dm_admin_session', JSON.stringify({ expiry }));
      setIsAuthenticated(true);
      setIsLocked(false);
      return true;
    }
    return false;
  }, []);

  const unlock = useCallback((password) => {
    const settings = DS.getSettings();
    if (password === settings.adminPassword) {
      setIsLocked(false);
      resetLockTimer();
      return true;
    }
    return false;
  }, [resetLockTimer]);

  const logout = useCallback(() => {
    localStorage.removeItem('dm_admin_session');
    setIsAuthenticated(false);
    setIsLocked(false);
    if (lockTimer.current) clearTimeout(lockTimer.current);
  }, []);

  return (
    <AdminContext.Provider value={{
      isAuthenticated,
      isLocked,
      login,
      unlock,
      logout,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}

// Protected route wrapper
export function AdminRoute({ children }) {
  const { isAuthenticated, isLocked, unlock } = useAdmin();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  if (isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Session Locked</h2>
            <p className="text-gray-500 mt-1">Enter password to unlock</p>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (unlock(password)) {
              setError('');
              setPassword('');
            } else {
              setError('Incorrect password');
            }
          }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="input-field mb-4"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button type="submit" className="btn-primary w-full">Unlock</button>
          </form>
        </div>
      </div>
    );
  }

  return children;
}
