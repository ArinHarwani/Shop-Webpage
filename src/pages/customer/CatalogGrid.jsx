import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import FilterBar from '../../components/FilterBar';
import ItemCard from '../../components/ItemCard';
import SwipeMode from '../../components/SwipeMode';
import * as DS from '../../services/DataService';
import { useSession } from '../../contexts/SessionContext';

const ITEMS_PER_PAGE = 24;

// Skeleton card placeholder
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-stone/60 shadow-card">
      <div className="aspect-[3/4] skeleton" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-3 w-16 rounded-full" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="flex gap-1.5 mt-3">
          <div className="skeleton w-6 h-6 rounded-full" />
          <div className="skeleton w-6 h-6 rounded-full" />
          <div className="skeleton w-6 h-6 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function CatalogGrid() {
  const { trackActivity } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = searchParams.get('type') || null;

  const [filters, setFilters] = useState({
    type: initialType,
    occasion: 'All',
    collection: 'All',
    sizes: [],
    colours: [],
  });
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(!!initialType); // show skeleton on first load if type pre-set
  const [viewMode] = useState('grid'); // always grid, swipe is an in-grid feature

  // Sync URL type param on initial load
  useEffect(() => {
    if (initialType) {
      setFilters(f => ({ ...f, type: initialType }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Simulate skeleton delay only on type change (data is from localStorage, fast)
  const loadingTimer = useRef(null);
  useEffect(() => {
    if (filters.type) {
      setIsLoading(true);
      clearTimeout(loadingTimer.current);
      loadingTimer.current = setTimeout(() => setIsLoading(false), 400);
    }
    return () => clearTimeout(loadingTimer.current);
  }, [filters.type]);

  const paginatedItems = allItems.slice(0, visibleCount);
  const hasMore = visibleCount < allItems.length;

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setVisibleCount(ITEMS_PER_PAGE);
    trackActivity();
    // Sync type to URL
    if (newFilters.type) {
      setSearchParams({ type: newFilters.type }, { replace: true });
    }
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">

        {/* No type selected */}
        {!filters.type && (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-up">
            <div className="w-20 h-20 bg-stone rounded-3xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-dust" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="font-display text-2xl text-charcoal font-semibold mb-2">Select a Category</h3>
            <p className="text-slate text-base">Choose a category from the filters above to browse the collection</p>
          </div>
        )}

        {/* Loading skeleton */}
        {filters.type && isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {filters.type && !isLoading && allItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-up">
            <div className="w-20 h-20 bg-stone rounded-3xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-dust" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-display text-2xl text-charcoal font-semibold mb-2">Nothing here yet</h3>
            <p className="text-slate text-base max-w-xs">
              No items in this category right now — ask our staff or try a different filter.
            </p>
          </div>
        )}

        {/* Grid */}
        {filters.type && !isLoading && allItems.length > 0 && (
          <>
            {/* Results count */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-slate">
                <span className="font-semibold text-charcoal">{allItems.length}</span> items
                {visibleCount < allItems.length && (
                  <span> · showing {paginatedItems.length}</span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {paginatedItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${(idx % ITEMS_PER_PAGE) * 40}ms`, animationFillMode: 'both' }}
                >
                  <ItemCard item={item} priority={idx < 6} />
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-10 mb-6">
                <button
                  onClick={handleLoadMore}
                  className="px-8 py-3.5 bg-white border border-stone text-charcoal font-semibold rounded-xl hover:border-accent hover:text-accent hover:bg-accent-light transition-all duration-250 shadow-card text-sm"
                >
                  Load More · {allItems.length - visibleCount} remaining
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom padding so FAB doesn't overlap last card */}
      <div className="h-24" />
    </div>
  );
}
