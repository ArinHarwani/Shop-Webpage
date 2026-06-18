import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import * as DS from '../../services/DataService';

export default function CustomerShortlists() {
  const [sessions, setSessions] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsub1 = DS.subscribe('shortlist_items', () => setRefreshKey(k => k + 1));
    const unsub2 = DS.subscribe('customer_sessions', () => setRefreshKey(k => k + 1));
    return () => { unsub1(); unsub2(); };
  }, []);

  useEffect(() => {
    const active = DS.getActiveSessions();
    const withShortlists = active.map(session => {
      const shortlist = DS.getShortlist(session.id);
      return { ...session, shortlist };
    }).filter(s => s.shortlist.length > 0);
    setSessions(withShortlists);
  }, [refreshKey]);

  const handleMarkSold = (variantId) => {
    DS.updateVariantStatus(variantId, 'sold');
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Customer Shortlists</h1>
        <p className="text-gray-500 mt-1">Real-time view of active customer sessions and their saved items</p>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No active shortlists</h3>
          <p className="text-gray-500 mt-1">Customer shortlists will appear here in real time</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sessions.map((session, idx) => (
            <div
              key={session.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Session Header */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {session.customer_name || `Guest`}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {session.device_label} · Started at {formatTime(session.started_at)} · {session.shortlist.length} items
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full">
                  Active
                </span>
              </div>

              {/* Shortlist Items */}
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {session.shortlist.map(entry => (
                    <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      {/* Thumbnail */}
                      <div className="w-14 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <img
                          src={entry.variant?.image_url}
                          alt={entry.item?.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = `https://placehold.co/140x160/EEF2FF/4F46E5?text=?`;
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/admin/item/${entry.item?.id}`}
                          className="font-medium text-gray-900 text-sm hover:text-brand-600 transition-colors truncate block"
                        >
                          {entry.item?.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div
                            className="w-3 h-3 rounded-full border border-gray-200"
                            style={{ backgroundColor: entry.variant?.colour_hex }}
                          />
                          <span className="text-xs text-gray-500">{entry.variant?.colour_name} · {entry.variant?.size}</span>
                        </div>
                        {/* Godown location */}
                        {(entry.item?.godown_number || entry.item?.rack_number) && (
                          <p className="text-xs text-amber-600 mt-1 font-medium">
                            📦 {[entry.item?.godown_number, entry.item?.rack_number, entry.item?.shelf].filter(Boolean).join(' → ')}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="shrink-0">
                        {entry.variant?.status === 'sold' ? (
                          <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-lg">Sold</span>
                        ) : (
                          <button
                            onClick={() => handleMarkSold(entry.variant?.id)}
                            className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                          >
                            Mark Sold
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
