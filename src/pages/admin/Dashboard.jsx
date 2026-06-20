import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import * as DS from '../../services/DataService';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setMetrics(DS.getDashboardMetrics());
    const unsub1 = DS.subscribe('items', () => setRefreshKey(k => k + 1));
    const unsub2 = DS.subscribe('item_variants', () => setRefreshKey(k => k + 1));
    const unsub3 = DS.subscribe('shortlist_items', () => setRefreshKey(k => k + 1));
    const unsub4 = DS.subscribe('customer_sessions', () => setRefreshKey(k => k + 1));
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, []);

  useEffect(() => {
    setMetrics(DS.getDashboardMetrics());
  }, [refreshKey]);

  if (!metrics) return null;

  const metricCards = [
    {
      label: 'Total Active Items',
      value: metrics.totalActive,
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      colour: 'from-brand-500 to-brand-600',
      bg: 'bg-brand-50',
      text: 'text-brand-600',
    },
    {
      label: 'Sold Today',
      value: metrics.soldToday,
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      colour: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    {
      label: 'Pending Removal',
      value: metrics.pendingRemoval,
      icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      colour: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
    {
      label: 'Active Sessions',
      value: metrics.activeSessions,
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      colour: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      label: 'New Arrivals (7d)',
      value: metrics.newArrivals,
      icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
      colour: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
    },
    {
      label: 'Total Images',
      value: metrics.totalImagesUploaded || 0,
      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      colour: 'from-pink-500 to-pink-600',
      bg: 'bg-pink-50',
      text: 'text-pink-600',
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Inventory snapshot at a glance</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {metricCards.map((card, idx) => (
          <div
            key={card.label}
            className="metric-card animate-slide-up"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center mb-4`}>
              <svg className={`w-6 h-6 ${card.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Most Shortlisted Today */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-fade-in">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Most Shortlisted Today</h2>
        {metrics.mostShortlisted.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">No shortlists today yet</p>
        ) : (
          <div className="space-y-3">
            {metrics.mostShortlisted.map(({ item, count }, idx) => (
              <Link
                key={item.id}
                to={`/admin/item/${item.id}`}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <span className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                  #{idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate group-hover:text-brand-700 transition-colors">{item.name}</p>
                  <p className="text-sm text-gray-500">₹{item.price?.toLocaleString('en-IN')}</p>
                </div>
                <span className="text-sm font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
                  {count} save{count !== 1 ? 's' : ''}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/shortlists"
          className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-300 group"
        >
          <svg className="w-8 h-8 text-brand-500 mb-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="font-semibold text-gray-900">View Customer Shortlists</h3>
          <p className="text-sm text-gray-500 mt-1">See what customers are saving</p>
        </Link>
        <Link
          to="/admin/add-item"
          className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-300 group"
        >
          <svg className="w-8 h-8 text-emerald-500 mb-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h3 className="font-semibold text-gray-900">Add New Item</h3>
          <p className="text-sm text-gray-500 mt-1">Upload a new product</p>
        </Link>
        <Link
          to="/admin/inventory"
          className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-300 group"
        >
          <svg className="w-8 h-8 text-amber-500 mb-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="font-semibold text-gray-900">Manage Inventory</h3>
          <p className="text-sm text-gray-500 mt-1">View and update items</p>
        </Link>
      </div>
    </AdminLayout>
  );
}
