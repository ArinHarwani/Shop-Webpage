import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import * as DS from '../services/DataService';

export default function FloatingShortlistButton() {
  const { shortlist, shortlistCount, lastAddedAt, removeFromShortlist } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const prevAddedAt = useRef(null);

  // Don't show FAB on welcome screen or admin pages
  const hidden = location.pathname === '/' || location.pathname.startsWith('/admin');
  
  // Fade in FAB after mount
  useEffect(() => {
    if (!hidden) {
      const t = setTimeout(() => setIsVisible(true), 200);
      return () => clearTimeout(t);
    } else {
      setIsVisible(false);
    }
  }, [hidden]);

  // Trigger pulse when item is added
  useEffect(() => {
    if (lastAddedAt && lastAddedAt !== prevAddedAt.current) {
      prevAddedAt.current = lastAddedAt;
      setIsPulsing(true);
      const t = setTimeout(() => setIsPulsing(false), 600);
      return () => clearTimeout(t);
    }
  }, [lastAddedAt]);

  // Close panel on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (hidden) return null;

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fab ${isPulsing ? 'fab-pulse' : ''} transition-all duration-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        aria-label={`View shortlist (${shortlistCount} items)`}
      >
        <svg className="w-6 h-6" fill={shortlistCount > 0 ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={shortlistCount > 0 ? 0 : 1.8}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {shortlistCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-charcoal text-ivory text-[11px] font-bold rounded-full flex items-center justify-center animate-bounce-in">
            {shortlistCount}
          </span>
        )}
      </button>

      {/* Slide-in Panel Overlay */}
      {isOpen && (
        <div
          className="panel-overlay animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Shortlist Drawer */}
      <div
        className={`panel-drawer transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone shrink-0">
          <div>
            <h2 className="font-display text-2xl text-charcoal font-semibold">My Shortlist</h2>
            <p className="text-sm text-slate mt-0.5">
              {shortlistCount === 0 ? 'Nothing saved yet' : `${shortlistCount} item${shortlistCount !== 1 ? 's' : ''} saved`}
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate hover:bg-stone transition-colors"
            aria-label="Close shortlist"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto">
          {shortlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-stone flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-dust" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="font-display text-xl text-charcoal font-medium mb-1">Nothing here yet</p>
              <p className="text-sm text-slate">Tap the heart on any item to save it here</p>
            </div>
          ) : (
            <div className="divide-y divide-stone/50">
              {shortlist.map((entry) => {
                const imgUrl = DS.getOptimizedImageUrl(entry.variant?.image_url, 150, 'auto');
                return (
                  <div key={entry.id} className="flex items-center gap-3 p-4 hover:bg-ivory/60 transition-colors">
                    {/* Thumbnail */}
                    <button
                      onClick={() => { setIsOpen(false); navigate(`/item/${entry.item?.id}`); }}
                      className="shrink-0 w-14 h-18 rounded-xl overflow-hidden bg-stone"
                      style={{ height: '72px' }}
                    >
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={entry.item?.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full skeleton" />
                      )}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => { setIsOpen(false); navigate(`/item/${entry.item?.id}`); }}
                        className="text-left w-full"
                      >
                        <p className="font-semibold text-charcoal text-sm leading-tight line-clamp-2">
                          {entry.item?.name}
                        </p>
                      </button>
                      {entry.item?.item_code && (
                        <p className="text-xs font-mono text-dust mt-0.5">{entry.item.item_code}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-stone/80 shrink-0"
                          style={{ backgroundColor: entry.variant?.colour_hex }}
                        />
                        <span className="text-xs text-slate capitalize">{entry.variant?.colour_name}</span>
                        <span className="text-stone">·</span>
                        <span className="text-xs text-slate font-medium">
                          {entry.variant?.size === 'free_size' ? 'Free Size' : entry.variant?.size}
                        </span>
                      </div>
                      {entry.item?.price > 0 && (
                        <p className="text-sm font-bold text-charcoal mt-1">
                          ₹{entry.item.price.toLocaleString('en-IN')}
                        </p>
                      )}
                      {entry.variant?.status === 'sold' && (
                        <span className="text-xs text-red-500 font-medium">Sold Out</span>
                      )}
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromShortlist(entry.id)}
                      className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-dust hover:text-red-400 hover:bg-red-50 transition-all duration-200"
                      aria-label="Remove from shortlist"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {shortlist.length > 0 && (
          <div className="px-5 py-4 border-t border-stone bg-ivory shrink-0 pb-safe">
            <div className="flex items-center gap-2 p-3 bg-accent-light rounded-xl border border-accent/20 mb-3">
              <svg className="w-4 h-4 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-accent-dark leading-snug">
                Show this list to our staff — they'll bring these items for you to try on.
              </p>
            </div>
            <button
              onClick={() => { setIsOpen(false); navigate('/shortlist'); }}
              className="w-full py-3 rounded-xl border border-stone bg-white text-charcoal font-semibold text-sm hover:bg-stone/40 transition-colors"
            >
              View Full Shortlist
            </button>
          </div>
        )}
      </div>
    </>
  );
}
