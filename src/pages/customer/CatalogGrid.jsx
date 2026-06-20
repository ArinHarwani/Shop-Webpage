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
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
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
                style={{ animationDelay: `${(idx % ITEMS_PER_PAGE) * 50}ms` }}
              >
                {/* We pass high priority to the first 4 items of the very first page to improve LCP */}
                <ItemCard item={item} priority={idx < 4} />
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

        {/* Load More Pagination */}
        {hasMore && (
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
