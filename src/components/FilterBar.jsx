import React, { useState } from 'react';
import * as DS from '../services/DataService';

const TYPE_LABELS = {
  top: 'Top', bottom: 'Bottom', shorts: 'Shorts', long_dress: 'Long Dress',
  coord_set: 'Coord Set', kurti: 'Kurti', other: 'Others',
};

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size', 'free_size'];

const OCCASION_LABELS = ['Casual', 'Festive', 'Office', 'Party', 'Wedding'];

export default function FilterBar({ filters, onFilterChange }) {
  const available = DS.getAvailableFilterValues();
  const [expanded, setExpanded] = useState(false);

  const setFilter = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const toggleMulti = (key, value) => {
    const current = filters[key] || [];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFilter(key, next);
  };

  const clearAll = () => {
    onFilterChange({ type: null, occasion: 'All', collection: 'All', sizes: [], colours: [] });
  };

  const hasActiveFilters = filters.type !== null || filters.occasion !== 'All' ||
    filters.collection !== 'All' ||
    (filters.sizes && filters.sizes.length > 0) || (filters.colours && filters.colours.length > 0);

  // Count active secondary filters for the badge
  const secondaryFilterCount = [
    filters.occasion !== 'All' ? 1 : 0,
    filters.collection !== 'All' ? 1 : 0,
    (filters.sizes?.length || 0),
    (filters.colours?.length || 0),
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Type filter — always visible */}
        <div className="flex items-center gap-2 mb-0">
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-1">
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilter('type', val)}
                  className={`filter-chip whitespace-nowrap shrink-0 ${filters.type === val ? 'filter-chip-active' : 'filter-chip-inactive'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle for secondary filters — mobile only */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="sm:hidden shrink-0 relative flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-brand-600 hover:border-brand-200 transition-all"
            aria-label="Toggle filters"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {secondaryFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {secondaryFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Secondary filters — always visible on desktop, collapsible on mobile */}
        <div className={`${expanded ? 'block' : 'hidden'} sm:block mt-3 sm:mt-4`}>
          <div className="flex flex-wrap items-start gap-4 sm:gap-6">
            {/* Occasion filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Occasion</label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <button
                  onClick={() => setFilter('occasion', 'All')}
                  className={`filter-chip ${filters.occasion === 'All' ? 'filter-chip-active' : 'filter-chip-inactive'}`}
                >
                  All
                </button>
                {OCCASION_LABELS.map(occ => (
                  <button
                    key={occ}
                    onClick={() => setFilter('occasion', occ.toLowerCase())}
                    className={`filter-chip ${filters.occasion === occ.toLowerCase() ? 'filter-chip-active' : 'filter-chip-inactive'}`}
                  >
                    {occ}
                  </button>
                ))}
              </div>
            </div>

            {/* Collections filter */}
            {available.collections && available.collections.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Collection</label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setFilter('collection', 'All')}
                    className={`filter-chip ${(filters.collection || 'All') === 'All' ? 'filter-chip-active' : 'filter-chip-inactive'}`}
                  >
                    All
                  </button>
                  {available.collections.map(col => (
                    <button
                      key={col.id}
                      onClick={() => setFilter('collection', col.name)}
                      className={`filter-chip ${filters.collection === col.name ? 'filter-chip-active' : 'filter-chip-inactive'}`}
                    >
                      {col.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Size</label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {SIZE_ORDER.filter(s => available.sizes.includes(s)).map(size => (
                  <button
                    key={size}
                    onClick={() => toggleMulti('sizes', size)}
                    className={`filter-chip ${(filters.sizes || []).includes(size) ? 'filter-chip-active' : 'filter-chip-inactive'}`}
                  >
                    {size === 'free_size' ? 'Free' : size}
                  </button>
                ))}
              </div>
            </div>

            {/* Colour filter */}
            {available.colours.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Colour</label>
                <div className="flex flex-wrap gap-2">
                  {available.colours.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => toggleMulti('colours', c.hex)}
                      title={c.name}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all duration-200 ${
                        (filters.colours || []).includes(c.hex)
                          ? 'ring-2 ring-brand-600 ring-offset-2 border-white scale-110'
                          : 'border-gray-200 hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Clear filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearAll}
                  className="btn-ghost text-sm text-red-500 hover:bg-red-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
