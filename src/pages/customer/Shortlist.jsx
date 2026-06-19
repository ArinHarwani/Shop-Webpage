import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import { useSession } from '../../contexts/SessionContext';
import * as DS from '../../services/DataService';

export default function Shortlist() {
  const { shortlist, removeFromShortlist, sessionId } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Shortlist</h1>
            <p className="text-gray-500 mt-1">
              {shortlist.length} item{shortlist.length !== 1 ? 's' : ''} saved
              <span className="text-gray-400"> · Max 20</span>
            </p>
          </div>
          <Link to="/catalog" className="btn-secondary text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Continue Browsing
          </Link>
        </div>

        {shortlist.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-24 h-24 bg-brand-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your shortlist is empty</h3>
            <p className="text-gray-500 mb-6">Browse the catalog and save items you'd like to try</p>
            <Link to="/catalog" className="btn-primary">
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {shortlist.map((entry, idx) => (
              <div
                key={entry.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Thumbnail */}
                  <Link to={`/item/${entry.item?.id}`} className="shrink-0">
                    <div className="w-20 h-24 rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={DS.getOptimizedImageUrl(entry.variant?.image_url, 800, 75)}
                        alt={entry.item?.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://placehold.co/200x250/EEF2FF/4F46E5?text=${encodeURIComponent(entry.item?.name || '?')}`;
                        }}
                      />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/item/${entry.item?.id}`} className="hover:text-brand-600 transition-colors">
                      <h3 className="font-semibold text-gray-900 truncate">{entry.item?.name}</h3>
                    </Link>
                    {entry.item?.item_code && (
                      <span className="text-xs font-mono text-gray-400">{entry.item.item_code}</span>
                    )}
                    {entry.item?.price > 0 && (
                      <p className="text-lg font-bold text-gradient mt-0.5">
                        ₹{entry.item?.price?.toLocaleString('en-IN')}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-200"
                          style={{ backgroundColor: entry.variant?.colour_hex }}
                        />
                        <span className="text-sm text-gray-500">{entry.variant?.colour_name}</span>
                      </div>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm text-gray-500">
                        Size: <span className="font-medium text-gray-700">{entry.variant?.size === 'free_size' ? 'Free Size' : entry.variant?.size}</span>
                      </span>
                      {entry.variant?.status === 'sold' && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-sm text-red-500 font-medium">Sold Out</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromShortlist(entry.id)}
                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
                    title="Remove from shortlist"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        {shortlist.length > 0 && (
          <div className="mt-8 p-6 bg-brand-50 rounded-2xl border border-brand-100 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-brand-900">How to use your shortlist</h4>
                <p className="text-brand-700 text-sm mt-1">
                  Show this list to our staff, and they'll bring these items for you to try on.
                  Your shortlist will be saved for 2 hours.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
