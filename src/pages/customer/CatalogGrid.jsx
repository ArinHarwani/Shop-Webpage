import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/Header';
import FilterBar from '../../components/FilterBar';
import ItemCard from '../../components/ItemCard';
import SwipeMode from '../../components/SwipeMode';
import * as DS from '../../services/DataService';
import { useSession } from '../../contexts/SessionContext';

const ITEMS_PER_PAGE = 24;

export default function CatalogGrid() {
  const { trackActivity } = useSession();
  const [filters, setFilters] = useState({ type: null, occasion: 'All', collection: 'All', sizes: [], colours: [] });
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('dm_view_mode') || 'swipe');

  useEffect(() => {
    localStorage.setItem('dm_view_mode', viewMode);
  }, [viewMode]);

  // Listen for data changes
  useEffect(() => {
    const unsub = DS.subscribe('items', () => setRefreshKey(k => k + 1));
    return unsub;
  }, []);

  const allItems = useMemo(() => {
    if (!filters.type) return [];
    return DS.getItems(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, refreshKey]);

  const paginatedItems = allItems.slice(0, visibleCount);
  const hasMore = visibleCount < allItems.length;

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setVisibleCount(ITEMS_PER_PAGE);
    trackActivity();
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results count & Toggle */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {viewMode === 'grid' ? (
              <>Showing <span className="font-semibold text-gray-900">{paginatedItems.length}</span> of{' '}</>
            ) : null}
            <span className="font-semibold text-gray-900">{allItems.length}</span> items
          </p>
          
          <div className="flex bg-gray-200/80 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setViewMode('swipe')}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                viewMode === 'swipe' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Swipe
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                viewMode === 'grid' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Grid
            </button>
          </div>
        </div>

        {/* Content */}
        {!filters.type ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Select a Category</h3>
            <p className="text-gray-500">Please choose a category from the filters above to view items</p>
          </div>
        ) : allItems.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No items found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : viewMode === 'swipe' ? (
          <SwipeMode items={allItems} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {paginatedItems.map((item, idx) => (
              <div
                key={item.id}
                className="animate-fade-in"
                style={{ animationDelay: `${(idx % ITEMS_PER_PAGE) * 50}ms` }}
              >
                <ItemCard item={item} priority={idx < 4} />
              </div>
            ))}
          </div>
        )}


        {/* Load More Pagination */}
        {viewMode === 'grid' && hasMore && (
          <div className="flex justify-center mt-12 mb-8">
            <button
              onClick={handleLoadMore}
              className="px-8 py-3 bg-white border-2 border-brand-100 text-brand-600 font-semibold rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-all duration-300 shadow-sm"
            >
              Load More Items
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
