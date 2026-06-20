import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import * as DS from '../../services/DataService';

export default function WelcomeScreen() {
  const [name, setName] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  const { startSession } = useSession();
  const settings = DS.getSettings();

  const handleStart = async () => {
    setIsAnimating(true);
    await startSession(name.trim());
    setTimeout(() => navigate('/catalog'), 400);
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 flex items-center justify-center p-6 cursor-pointer select-none transition-opacity duration-500 ${isAnimating ? 'opacity-0 scale-105' : 'opacity-100'}`}
      onClick={handleStart}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-lg w-full animate-fade-in">
        {/* Logo */}
        <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/10">
          <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>

        {/* Shop name */}
        <h1 className="text-6xl sm:text-7xl font-black text-white mb-4 tracking-tight">
          {settings.shopName || 'DressMirror'}
        </h1>

        <p className="text-xl text-brand-200 mb-12 font-light">
          Virtual Outfit Catalog
        </p>

        {/* Optional name input */}
        <div
          className="mb-8"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full max-w-xs mx-auto block px-6 py-4 bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl text-white placeholder:text-white/40 text-center text-lg font-medium focus:border-white/40 focus:ring-4 focus:ring-white/10 outline-none transition-all duration-300"
            onKeyDown={(e) => { if (e.key === 'Enter') handleStart(); }}
          />
        </div>

        {/* CTA */}
        <button
          onClick={(e) => { e.stopPropagation(); handleStart(); }}
          className="inline-flex items-center gap-3 px-10 py-4 bg-white text-brand-700 font-bold text-lg rounded-2xl shadow-2xl shadow-black/20 hover:shadow-3xl hover:scale-105 active:scale-[0.98] transition-all duration-300 group"
        >
          Start Browsing
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        <p className="mt-8 text-brand-300/60 text-sm animate-pulse-soft">
          Tap anywhere to begin
        </p>
      </div>
    </div>
  );
}
