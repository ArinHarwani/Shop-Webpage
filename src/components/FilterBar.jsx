import React, { useState, useEffect } from 'react';
import * as DS from '../services/DataService';

const TYPE_LABELS = {
  top: 'Tops', bottom: 'Bottoms', shorts: 'Shorts', long_dress: 'Long Dress', one_piece: 'One Piece',
  coord_set: 'Coord Sets', kurti: 'Kurtis', other: 'Others',
};

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size', 'free_size'];

const OCCASION_LABELS = ['Casual', 'Festive', 'Office', 'Party', 'Wedding'];

export default function FilterBar({ filters, onFilterChange }) {
  const available = DS.getAvailableFilterValues();
  const [expanded, setExpanded] = useState(false);

  // Close expanded on type change
  useEffect(() => {
    setExpanded(false);
  }, [filters.type]);

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
    setExpanded(false);
  };

  const secondaryFilterCount = [
    filters.occasion !== 'All' ? 1 : 0,
    filters.collection !== 'All' ? 1 : 0,
    (filters.sizes?.length || 0),
    (filters.colours?.length || 0),
  ].reduce((a, b) => a + b, 0);

  const hasActiveFilters = filters.type !== null || secondaryFilterCount > 0;

  return (
    <div className="bg-ivory/95 backdrop-blur-md border-b border-stone sticky top-14 z-30">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3">

        {/* Row 1: Category chips + filter toggle */}
        <div className="flex items-center gap-3">
          {/* Category scroll strip */}
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-0.5">
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilter('type', val)}
                  className={`filter-chip shrink-0 ${
                    filters.type === val ? 'filter-chip-active' : 'filter-chip-inactive'
                  }`}
                >
                  {label}
                </button>
              ))}
              {/* Clear all button inline if type selected */}
              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="shrink-0 px-3 py-2 rounded-full text-sm font-medium text-dust border border-stone bg-white hover:text-charcoal hover:border-dust transition-all duration-200"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          {/* Refine / filter toggle button — only show when a type is selected */}
          {filters.type && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={`shrink-0 relative flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${
                expanded || secondaryFilterCount > 0
                  ? 'border-accent text-accent bg-accent-light'
                  : 'border-stone text-slate bg-white hover:border-dust hover:text-charcoal'
              }`}
              aria-label="Refine filters"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="hidden sm:inline">Refine</span>
              {secondaryFilterCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 bg-accent text-ivory text-[10px] font-bold rounded-full flex items-center justify-center">
                  {secondaryFilterCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Row 2: Secondary filters (collapsible) */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            expanded ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-wrap gap-x-6 gap-y-4 pb-2">

            {/* Occasion */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate uppercase tracking-widest">Occasion</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFilter('occasion', 'All')}
                  className={`filter-chip text-xs py-1.5 px-3 ${filters.occasion === 'All' ? 'filter-chip-active' : 'filter-chip-inactive'}`}
                >All</button>
                {OCCASION_LABELS.map(occ => (
                  <button
                    key={occ}
                    onClick={() => setFilter('occasion', occ.toLowerCase())}
                    className={`filter-chip text-xs py-1.5 px-3 ${filters.occasion === occ.toLowerCase() ? 'filter-chip-active' : 'filter-chip-inactive'}`}
                  >{occ}</button>
                ))}
              </div>
            </div>

            {/* Collection */}
            {available.collections && available.collections.length > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate uppercase tracking-widest">Collection</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilter('collection', 'All')}
                    className={`filter-chip text-xs py-1.5 px-3 ${(filters.collection || 'All') === 'All' ? 'filter-chip-active' : 'filter-chip-inactive'}`}
                  >All</button>
                  {available.collections.map(col => (
                    <button
                      key={col.id}
                      onClick={() => setFilter('collection', col.name)}
                      className={`filter-chip text-xs py-1.5 px-3 ${filters.collection === col.name ? 'filter-chip-active' : 'filter-chip-inactive'}`}
                    >{col.name}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Size */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate uppercase tracking-widest">Size</label>
              <div className="flex flex-wrap gap-1.5">
                {SIZE_ORDER.filter(s => available.sizes.includes(s)).map(size => (
                  <button
                    key={size}
                    onClick={() => toggleMulti('sizes', size)}
                    className={`filter-chip text-xs py-1.5 px-3 ${(filters.sizes || []).includes(size) ? 'filter-chip-active' : 'filter-chip-inactive'}`}
                  >
                    {size === 'free_size' ? 'Free' : size}
                  </button>
                ))}
              </div>
            </div>

            {/* Colour */}
            {available.colours.length > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate uppercase tracking-widest">Colour</label>
                <div className="flex flex-wrap gap-2">
                  {available.colours.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => toggleMulti('colours', c.hex)}
                      title={c.name}
                      className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                        (filters.colours || []).includes(c.hex)
                          ? 'ring-2 ring-accent ring-offset-2 border-white scale-110'
                          : 'border-stone hover:scale-110 hover:border-dust'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
