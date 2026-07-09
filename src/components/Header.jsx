import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as DS from '../services/DataService';

export default function Header() {
  const location = useLocation();
  const settings = DS.getSettings();

  const isAdmin = location.pathname.startsWith('/admin');

  // Admin header — keep as-is
  if (isAdmin) {
    return (
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/catalog" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gradient hidden sm:block">{settings.shopName || 'DressMirror'}</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // Customer header — slim boutique style
  return (
    <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur-md border-b border-stone shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Shop Name */}
          <Link
            to="/catalog"
            className="flex items-center gap-2 group no-select"
          >
            <span className="font-display text-2xl text-charcoal font-semibold tracking-tight leading-none group-hover:text-accent transition-colors duration-200">
              {settings.shopName || 'DressMirror'}
            </span>
          </Link>

          {/* Right nav */}
          <nav className="flex items-center gap-1">
            <Link
              to="/catalog"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === '/catalog'
                  ? 'text-accent bg-accent-light'
                  : 'text-slate hover:text-charcoal hover:bg-stone/50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="hidden sm:inline">Catalog</span>
            </Link>

            <Link
              to="/size-guide"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === '/size-guide'
                  ? 'text-accent bg-accent-light'
                  : 'text-slate hover:text-charcoal hover:bg-stone/50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Size Guide</span>
            </Link>
          </nav>

        </div>
      </div>
    </header>
  );
}
