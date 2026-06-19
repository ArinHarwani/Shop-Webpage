import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/Header';
import FilterBar from '../../components/FilterBar';
import ItemCard from '../../components/ItemCard';
import * as DS from '../../services/DataService';
import { useSession } from '../../contexts/SessionContext';

const ITEMS_PER_PAGE = 24;

export default function CatalogGrid() {
  const { trackActivity } = useSession();
  const [filters, setFilters] = useState({ type: 'All', occasion: 'All', collection: 'All', sizes: [], colours: [] });
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for data changes
  useEffect(() => {
    const unsub = DS.subscribe('items', () => setRefreshKey(k => k + 1));
    return unsub;
  }, []);

  const allItems = useMemo(() => {
    return DS.getItems(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, refreshKey]);

  const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
  const paginatedItems = allItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    trackActivity();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{paginatedItems.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{allItems.length}</span> items
          </p>
        </div>

        {/* Grid */}
        {paginatedItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {paginatedItems.map((item, idx) => (
              <div
                key={item.id}
                className="animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <ItemCard item={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No items found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
              disabled={currentPage === 1}
              className="btn-ghost disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => { setCurrentPage(page); window.scrollTo(0, 0); }}
                className={`w-10 h-10 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  page === currentPage
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
              disabled={currentPage === totalPages}
              className="btn-ghost disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
