import React from 'react';
import * as DS from '../services/DataService';

const TYPE_LABELS = {
  top: 'Top', bottom: 'Bottom', shorts: 'Shorts', long_dress: 'Long Dress',
  coord_set: 'Coord Set', kurti: 'Kurti', other: 'Others',
};

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size', 'free_size'];

const OCCASION_LABELS = ['Casual', 'Festive', 'Office', 'Party', 'Wedding'];

export default function FilterBar({ filters, onFilterChange }) {
  const available = DS.getAvailableFilterValues();

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

  return (
    <div className="bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-start gap-6">
          {/* Type filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilter('type', val)}
                  className={`filter-chip ${filters.type === val ? 'filter-chip-active' : 'filter-chip-inactive'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Occasion filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Occasion</label>
            <div className="flex flex-wrap gap-2">
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
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Collection</label>
              <div className="flex flex-wrap gap-2">
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
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Size</label>
            <div className="flex flex-wrap gap-2">
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
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Colour</label>
              <div className="flex flex-wrap gap-2">
                {available.colours.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => toggleMulti('colours', c.hex)}
                    title={c.name}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
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
  );
}
