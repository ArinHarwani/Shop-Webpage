import React, { useState } from 'react';
import { useShopGeofence } from '../hooks/useShopGeofence';
import * as DS from '../services/DataService';

/**
 * Boutique Full-Screen Message Card
 */
function FullScreenContainer({ children, shopName = 'Fever Profile Fashion' }) {
  return (
    <div className="relative min-h-screen bg-ivory text-charcoal flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      {/* Decorative ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-stone/40 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-light/70 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>

      {/* Main Content Card */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl border border-stone/80 shadow-card-lg p-6 sm:p-8 text-center animate-fade-up">
        {children}
      </div>

      {/* Footer Branding */}
      <div className="relative z-10 mt-6 flex items-center gap-2 text-dust text-xs tracking-wider uppercase">
        <span>{shopName}</span>
        <span>•</span>
        <span>In-Store Catalog</span>
      </div>
    </div>
  );
}

export function ShopGeofenceGate({ children }) {
  const { status, recheck, distance, radiusMeters } = useShopGeofence();
  const [showHelp, setShowHelp] = useState(false);
  const settings = DS.getSettings();
  const shopName = settings.shopName || 'Fever Profile Fashion';

  // ── 1. CHECKING STATE ──────────────────────────────────────────
  if (status === 'checking') {
    return (
      <FullScreenContainer shopName={shopName}>
        {/* Animated Radar Pulse */}
        <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-accent/15 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-accent/25 animate-pulse" />
          <div className="relative w-14 h-14 bg-charcoal rounded-2xl flex items-center justify-center shadow-card text-ivory">
            <svg className="w-7 h-7 text-accent-mid animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl text-charcoal font-semibold tracking-tight mb-2">
          Verifying Location…
        </h2>
        <p className="text-slate text-sm leading-relaxed max-w-xs mx-auto">
          Checking your device’s proximity to {shopName}. Please wait a moment.
        </p>

        <div className="mt-6 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </FullScreenContainer>
    );
  }

  // ── 2. ALLOWED STATE (Render customer catalog) ─────────────────
  if (status === 'allowed') {
    return children;
  }

  // ── 3. DENIED STATE ────────────────────────────────────────────
  if (status === 'denied') {
    return (
      <FullScreenContainer shopName={shopName}>
        {/* Denied Icon */}
        <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl text-charcoal font-semibold tracking-tight mb-2">
          Location Access Needed
        </h2>
        <p className="text-slate text-sm leading-relaxed mb-6">
          {shopName}’s catalog is exclusively available to customers inside the boutique. Please enable location permissions in your browser to start browsing.
        </p>

        <div className="space-y-3">
          <button
            onClick={recheck}
            className="w-full btn-primary flex items-center justify-center gap-2 text-base shadow-card active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>

          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-xs text-dust hover:text-slate transition-colors py-1 inline-flex items-center gap-1"
          >
            <span>{showHelp ? 'Hide instructions' : 'How to enable location in browser?'}</span>
            <svg className={`w-3.5 h-3.5 transition-transform ${showHelp ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {showHelp && (
          <div className="mt-4 p-3.5 bg-ivory rounded-xl border border-stone text-left text-xs text-slate space-y-1.5 animate-fade-in">
            <p className="font-semibold text-charcoal">To enable location:</p>
            <p>1. Tap the <strong>lock / site settings icon 🔒</strong> in your browser address bar.</p>
            <p>2. Set <strong>Location</strong> permission to <strong>Allow</strong>.</p>
            <p>3. Tap the <strong>Try Again</strong> button above.</p>
          </div>
        )}
      </FullScreenContainer>
    );
  }

  // ── 4. OUT OF RANGE STATE ──────────────────────────────────────
  if (status === 'out_of_range') {
    return (
      <FullScreenContainer shopName={shopName}>
        {/* Out of Range Storefront Badge */}
        <div className="w-16 h-16 bg-accent-light text-accent rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-accent/20">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone/50 text-slate text-xs font-semibold uppercase tracking-wider mb-3">
          <span>In-Store Exclusive</span>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl text-charcoal font-semibold tracking-tight mb-2">
          Available Only In-Store
        </h2>
        <p className="text-slate text-sm leading-relaxed mb-4">
          This catalog can only be viewed inside {shopName}. Please connect to in-store Wi-Fi or browse on our store tablet while visiting.
        </p>

        {distance !== null && (
          <div className="p-3 bg-ivory rounded-xl border border-stone text-xs text-dust">
            Current location is outside the permitted {radiusMeters}m shop zone.
          </div>
        )}
      </FullScreenContainer>
    );
  }

  // ── 5. UNSUPPORTED BROWSER STATE ───────────────────────────────
  if (status === 'unsupported') {
    return (
      <FullScreenContainer shopName={shopName}>
        <div className="w-16 h-16 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-stone">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl text-charcoal font-semibold tracking-tight mb-2">
          Unsupported Device
        </h2>
        <p className="text-slate text-sm leading-relaxed">
          Your browser does not support geolocation. Please open this catalog using a modern mobile browser (Safari, Chrome, etc.).
        </p>
      </FullScreenContainer>
    );
  }

  // ── 6. ERROR / TIMEOUT STATE ───────────────────────────────────
  return (
    <FullScreenContainer shopName={shopName}>
      <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h2 className="font-display text-2xl sm:text-3xl text-charcoal font-semibold tracking-tight mb-2">
        Couldn’t Verify Location
      </h2>
      <p className="text-slate text-sm leading-relaxed mb-6">
        Please check your device’s GPS or location settings and try again.
      </p>

      <button
        onClick={recheck}
        className="w-full btn-primary flex items-center justify-center gap-2 text-base shadow-card active:scale-[0.98]"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Retry
      </button>
    </FullScreenContainer>
  );
}

export default ShopGeofenceGate;
