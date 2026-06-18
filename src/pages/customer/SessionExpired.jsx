import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SessionExpired() {
  const navigate = useNavigate();

  const handleRestart = () => {
    navigate('/');
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-brand-950 to-gray-900 flex items-center justify-center p-6 cursor-pointer"
      onClick={handleRestart}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-brand-400/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center animate-fade-in">
        <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/10">
          <svg className="w-10 h-10 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Session Ended</h1>
        <p className="text-xl text-brand-200 mb-12 max-w-md mx-auto font-light">
          Your browsing session has expired after 2 hours of inactivity.
        </p>

        <button
          onClick={handleRestart}
          className="inline-flex items-center gap-3 px-10 py-4 bg-white text-brand-700 font-bold text-lg rounded-2xl shadow-2xl hover:scale-105 active:scale-[0.98] transition-all duration-300"
        >
          Start Again
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <p className="mt-8 text-brand-300/50 text-sm animate-pulse-soft">
          Tap anywhere to start a new session
        </p>
      </div>
    </div>
  );
}
