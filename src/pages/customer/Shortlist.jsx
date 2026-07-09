import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import { useSession } from '../../contexts/SessionContext';
import * as DS from '../../services/DataService';

export default function Shortlist() {
  const { shortlist, removeFromShortlist } = useSession();

  return (
    <div className="min-h-screen bg-ivory">
      <Header />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-28">

        {/* Page heading */}
        <div className="flex items-end justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="font-display text-5xl text-charcoal font-semibold leading-tight">
              My Shortlist
            </h1>
            <p className="text-slate mt-1 text-sm">
              {shortlist.length === 0
                ? 'Nothing saved yet'
                : `${shortlist.length} item${shortlist.length !== 1 ? 's' : ''} saved · Max 20`}
            </p>
          </div>
          <Link
            to="/catalog"
            className="flex items-center gap-1.5 text-sm font-medium text-slate hover:text-accent transition-colors shrink-0 mb-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Continue Browsing
          </Link>
        </div>

        {/* Empty state */}
        {shortlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-up">
            <div className="w-24 h-24 bg-stone rounded-3xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-12 h-12 text-dust" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="font-display text-3xl text-charcoal font-semibold mb-2">
              Nothing here yet
            </h3>
            <p className="text-slate text-base mb-8 max-w-xs">
              Browse the collection and tap the heart button to save items you'd like to try on.
            </p>
            <Link
              to="/catalog"
              className="px-7 py-3.5 bg-charcoal text-ivory font-semibold rounded-xl shadow-card hover:bg-charcoal/90 active:scale-[0.98] transition-all duration-200"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <>
            {/* Shortlist items */}
            <div className="space-y-3">
              {shortlist.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl border border-stone/60 shadow-card overflow-hidden animate-fade-up hover:shadow-card-lg transition-shadow duration-300"
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Thumbnail */}
                    <Link to={`/item/${entry.item?.id}`} className="shrink-0">
                      <div className="w-16 rounded-xl overflow-hidden bg-stone/40" style={{ height: '80px' }}>
                        <img
                          src={DS.getOptimizedImageUrl(entry.variant?.image_url, 200, 'auto')}
                          alt={entry.item?.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/item/${entry.item?.id}`} className="block hover:text-accent transition-colors">
                        <h3 className="font-display text-lg text-charcoal font-medium leading-tight line-clamp-2">
                          {entry.item?.name}
                        </h3>
                      </Link>
                      {entry.item?.item_code && (
                        <span className="text-xs font-mono text-dust">{entry.item.item_code}</span>
                      )}
                      {entry.item?.price > 0 && (
                        <p className="text-base font-bold text-charcoal mt-0.5">
                          ₹{entry.item?.price?.toLocaleString('en-IN')}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-stone/80 shrink-0"
                            style={{ backgroundColor: entry.variant?.colour_hex }}
                          />
                          <span className="text-xs text-slate capitalize">{entry.variant?.colour_name}</span>
                        </div>
                        <span className="text-stone text-xs">·</span>
                        <span className="text-xs text-slate">
                          Size <span className="font-semibold text-charcoal">
                            {entry.variant?.size === 'free_size' ? 'Free Size' : entry.variant?.size}
                          </span>
                        </span>
                        {entry.variant?.status === 'sold' && (
                          <>
                            <span className="text-stone text-xs">·</span>
                            <span className="text-xs text-red-400 font-medium">Sold Out</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromShortlist(entry.id)}
                      className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-dust hover:bg-red-50 hover:text-red-400 transition-all duration-200"
                      aria-label="Remove from shortlist"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Staff instruction card */}
            <div className="mt-8 p-5 bg-accent-light rounded-2xl border border-accent/20 animate-fade-up">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-accent/15 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-charcoal text-sm">How to use your shortlist</h4>
                  <p className="text-accent-dark text-sm mt-1 leading-relaxed">
                    Show this screen to our staff and they'll bring all these items for you to try on.
                    Your shortlist is saved for <strong>2 hours</strong>.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
