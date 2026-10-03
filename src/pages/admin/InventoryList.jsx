import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import * as DS from '../../services/DataService';
import {
  getAdminInventoryState,
  saveAdminInventoryState,
} from '../../services/adminInventoryState';

const FILTER_TYPES = {
  top: 'Tops',
  one_piece_dresses: 'One Piece & Dresses (All)',
  one_piece: 'One Piece',
  long_dress: 'Long Dress',
  coord_ethnic: 'Coord Sets & Ethnic Fashion',
  bottom: 'Bottoms',
  other: 'Others',
};

const TYPE_LABELS = {
  top: 'Tops',
  tops: 'Tops',
  one_piece: 'One Piece',
  long_dress: 'Long Dress',
  one_piece_dresses: 'One Piece & Dresses',
  dress: 'Long Dress',
  dresses: 'Long Dress',
  coord_set: 'Coord Set',
  coord_ethnic: 'Coord Sets & Ethnic',
  traditional: 'Ethnic & Traditional',
  kurti: 'Kurti',
  bottom: 'Bottoms',
  bottoms: 'Bottoms',
  shorts: 'Shorts',
  other: 'Others',
  others: 'Others',
};

// Item Card Component for Grid and Large Grid Views
function AdminInventoryCard({
  item,
  isLarge = false,
  isHighlighted = false,
  onItemClick,
  onQuickSoldAll,
}) {
  const colours = item.colours || [];
  const [activeColourIdx, setActiveColourIdx] = useState(0);
  const currentColour = colours[activeColourIdx] || colours[0] || {};

  const availableVariants = (item.variants || []).filter(v => v.status === 'available');
  const availableCount = availableVariants.length;
  const totalCount = (item.variants || []).length;
  const availableSizes = [...new Set(availableVariants.map(v => v.size))];

  const imageUrl = DS.getOptimizedImageUrl(
    currentColour.image_url || `https://placehold.co/400x533/EEF2FF/4F46E5?text=${encodeURIComponent(item.name)}`,
    isLarge ? 700 : 420,
    'auto'
  );

  const locationString = [item.godown_number, item.rack_number, item.shelf]
    .filter(Boolean)
    .join(' → ');

  return (
    <div
      id={`inventory-item-${item.id}`}
      className={`group bg-white rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden ${
        isHighlighted
          ? 'border-brand-500 ring-4 ring-brand-500/25 shadow-xl scale-[1.01]'
          : 'border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200'
      }`}
    >
      {/* Image Container */}
      <div className={`relative bg-gray-100 overflow-hidden ${isLarge ? 'aspect-[3/4]' : 'aspect-[4/5]'}`}>
        <Link
          to={`/admin/item/${item.id}`}
          onClick={() => onItemClick(item.id)}
          className="block w-full h-full"
        >
          <img
            src={imageUrl}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.src = `https://placehold.co/400x533/EEF2FF/4F46E5?text=?`;
            }}
          />
        </Link>

        {/* Floating Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="font-mono font-bold text-xs bg-white/95 backdrop-blur-md text-brand-700 px-2.5 py-1 rounded-lg shadow-sm border border-brand-100/60 pointer-events-auto">
            {item.item_code || '—'}
          </span>

          <div className="pointer-events-auto flex items-center gap-1.5">
            {item.allSold ? (
              <span className="px-2.5 py-1 bg-red-600/90 text-white backdrop-blur-md text-xs font-semibold rounded-full shadow-sm">
                All Sold
              </span>
            ) : item.isNew ? (
              <span className="px-2.5 py-1 bg-emerald-600/90 text-white backdrop-blur-md text-xs font-semibold rounded-full shadow-sm">
                New
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-blue-600/90 text-white backdrop-blur-md text-xs font-semibold rounded-full shadow-sm">
                Active
              </span>
            )}
          </div>
        </div>

        {/* Colour Swatches floating over bottom of image */}
        {colours.length > 0 && (
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/20">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
              {colours.map((c, idx) => {
                const isSelected = idx === activeColourIdx;
                return (
                  <button
                    key={c.hex + idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveColourIdx(idx);
                    }}
                    title={c.name}
                    className={`rounded-full border-2 transition-all duration-200 shrink-0 ${
                      isSelected
                        ? 'w-5 h-5 border-white ring-2 ring-brand-400 scale-110 shadow-sm'
                        : 'w-4 h-4 border-white/70 hover:scale-110 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                );
              })}
            </div>
            {currentColour?.name && (
              <span className="text-[11px] text-white/90 font-medium truncate max-w-[100px] ml-2">
                {currentColour.name}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className={`flex-1 flex flex-col justify-between ${isLarge ? 'p-5' : 'p-4'}`}>
        <div>
          {/* Category & Location Badges */}
          <div className="flex items-center justify-between gap-2 mb-2 text-xs">
            <span className="font-semibold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-md truncate">
              {TYPE_LABELS[item.type] || item.type}
            </span>
            {locationString && (
              <span className="text-gray-500 font-medium truncate flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {locationString}
              </span>
            )}
          </div>

          {/* Item Name */}
          <Link
            to={`/admin/item/${item.id}`}
            onClick={() => onItemClick(item.id)}
            className={`font-bold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-1 ${
              isLarge ? 'text-lg mb-1.5' : 'text-base mb-1'
            }`}
          >
            {item.name}
          </Link>

          {/* Price & Fabric */}
          <div className="flex items-baseline justify-between mb-3">
            <span className={`font-bold text-gray-900 ${isLarge ? 'text-xl' : 'text-lg'}`}>
              {item.price > 0 ? `₹${item.price.toLocaleString('en-IN')}` : <span className="text-gray-400 font-normal italic text-sm">Price Hidden</span>}
            </span>
            {item.fabric && (
              <span className="text-xs text-gray-500 font-medium truncate max-w-[120px]">
                {item.fabric}
              </span>
            )}
          </div>

          {/* Stock / Available Variants */}
          <div className="bg-gray-50 rounded-xl p-2.5 mb-4 border border-gray-100">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-600 font-medium">Availability</span>
              <span className={`font-bold ${availableCount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {availableCount}/{totalCount} variants
              </span>
            </div>

            {/* Sizes List */}
            {availableSizes.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {availableSizes.map(s => (
                  <span key={s} className="px-1.5 py-0.5 bg-white border border-gray-200 text-gray-700 text-[10px] font-semibold rounded">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-red-500 font-medium">Out of stock</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          {!item.allSold && (
            <button
              type="button"
              onClick={() => onQuickSoldAll(item.id)}
              className="px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors shrink-0"
              title="Mark all variants of this item as sold"
            >
              Sell All
            </button>
          )}
          <Link
            to={`/admin/item/${item.id}`}
            onClick={() => onItemClick(item.id)}
            className="flex-1 text-center py-2 px-3 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <span>View Details</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function InventoryList() {
  const savedState = useMemo(() => getAdminInventoryState(), []);

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState(savedState.search || '');
  const [filterType, setFilterType] = useState(savedState.filterType || 'All');
  const [filterStatus, setFilterStatus] = useState(savedState.filterStatus || 'All');
  const [sortBy, setSortBy] = useState(savedState.sortBy || 'newest');
  const [viewMode, setViewMode] = useState(savedState.viewMode || 'large-grid');
  const [refreshKey, setRefreshKey] = useState(0);

  const [highlightedItemId, setHighlightedItemId] = useState(null);
  const hasRestoredScrollRef = useRef(false);

  // Sync data subscriptions
  useEffect(() => {
    const unsub = DS.subscribe('items', () => setRefreshKey(k => k + 1));
    const unsub2 = DS.subscribe('item_variants', () => setRefreshKey(k => k + 1));
    return () => { unsub(); unsub2(); };
  }, []);

  // Fetch items based on category
  useEffect(() => {
    const filters = {};
    if (filterType !== 'All') filters.type = filterType;
    setItems(DS.getItems(filters));
  }, [filterType, refreshKey]);

  // Persist filter changes to sessionStorage
  useEffect(() => {
    saveAdminInventoryState({
      search,
      filterType,
      filterStatus,
      sortBy,
      viewMode,
    });
  }, [search, filterType, filterStatus, sortBy, viewMode]);

  // Debounced scroll listener to remember scroll position
  useEffect(() => {
    let scrollTimer = null;
    const onScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        saveAdminInventoryState({ scrollY: window.scrollY });
      }, 150);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(scrollTimer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.fabric || '').toLowerCase().includes(q) ||
        (i.item_code || '').toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filterStatus === 'Available') {
      result = result.filter(i => !i.allSold);
    } else if (filterStatus === 'Sold') {
      result = result.filter(i => i.allSold);
    } else if (filterStatus === 'New') {
      result = result.filter(i => i.isNew);
    }

    // Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [items, search, filterStatus, sortBy]);

  // Restore scroll position and scroll to last active item when returning from item detail
  useEffect(() => {
    if (hasRestoredScrollRef.current) return;
    if (!items || items.length === 0) return;

    const saved = getAdminInventoryState();
    if (saved.lastItemId) {
      hasRestoredScrollRef.current = true;
      setHighlightedItemId(saved.lastItemId);

      const timer = setTimeout(() => {
        const targetEl = document.getElementById(`inventory-item-${saved.lastItemId}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (saved.scrollY > 0) {
          window.scrollTo({ top: saved.scrollY, behavior: 'smooth' });
        }
      }, 150);

      const clearHighlightTimer = setTimeout(() => {
        setHighlightedItemId(null);
      }, 2800);

      return () => {
        clearTimeout(timer);
        clearTimeout(clearHighlightTimer);
      };
    } else if (saved.scrollY > 0) {
      hasRestoredScrollRef.current = true;
      const timer = setTimeout(() => {
        window.scrollTo({ top: saved.scrollY, behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [items, filteredItems]);

  const handleItemClick = (itemId) => {
    saveAdminInventoryState({
      lastItemId: itemId,
      scrollY: window.scrollY,
      search,
      filterType,
      filterStatus,
      sortBy,
      viewMode,
    });
  };

  const handleQuickSoldAll = (itemId) => {
    const variants = DS.getVariants(itemId);
    variants.forEach(v => {
      if (v.status === 'available') {
        DS.updateVariantStatus(v.id, 'sold');
      }
    });
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilterType('All');
    setFilterStatus('All');
    setSortBy('newest');
  };

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 mt-1">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle: Table, Grid, Large Grid */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/80 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table View (Compact Rows)"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline">Table</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Standard Grid View"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="hidden sm:inline">Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('large-grid')}
              title="Large Size Grid View"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'large-grid'
                  ? 'bg-white text-brand-700 shadow-sm font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h6a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z M14 5a1 1 0 011-1h6a1 1 0 011 1v14a1 1 0 01-1 1h-6a1 1 0 01-1-1V5z" />
              </svg>
              <span className="hidden sm:inline">Large Grid</span>
            </button>
          </div>

          <Link to="/admin/add-item" className="btn-primary shrink-0">
            <svg className="w-5 h-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Item
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, code, or fabric..."
                className="input-field pl-10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select-field w-auto min-w-[150px]"
          >
            <option value="All">All Types</option>
            {Object.entries(FILTER_TYPES).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select-field w-auto min-w-[140px]"
          >
            <option value="All">All Status</option>
            <option value="Available">Available</option>
            <option value="Sold">All Sold</option>
            <option value="New">New Arrivals</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="select-field w-auto min-w-[150px]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-high">Price: High to Low</option>
            <option value="price-low">Price: Low to High</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Items Display: Table vs Grid vs Large Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">No items found</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-4">
            No inventory items matched your selected filters or search query.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn-secondary text-xs px-4 py-2"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Variants</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredItems.map(item => {
                  const availableCount = item.variants.filter(v => v.status === 'available').length;
                  const totalCount = item.variants.length;
                  const isHighlighted = highlightedItemId === item.id;

                  return (
                    <tr
                      key={item.id}
                      id={`inventory-item-${item.id}`}
                      className={`transition-all duration-300 ${
                        isHighlighted
                          ? 'bg-brand-50/80 ring-2 ring-brand-500 ring-inset'
                          : 'hover:bg-gray-50/60'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded">
                          {item.item_code || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/admin/item/${item.id}`}
                          onClick={() => handleItemClick(item.id)}
                          className="flex items-center gap-3 group"
                        >
                          <div className="w-12 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            <img
                              src={DS.getOptimizedImageUrl(item.colours?.[0]?.image_url, 120, 'auto')}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                e.target.src = `https://placehold.co/120x140/EEF2FF/4F46E5?text=?`;
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              {item.colours?.slice(0, 4).map((c, i) => (
                                <div
                                  key={c.hex + i}
                                  className="w-3 h-3 rounded-full border border-gray-200"
                                  style={{ backgroundColor: c.hex }}
                                  title={c.name}
                                />
                              ))}
                              {item.colours?.length > 4 && (
                                <span className="text-xs text-gray-400">+{item.colours.length - 4}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{TYPE_LABELS[item.type] || item.type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">
                          {item.price > 0 ? `₹${item.price.toLocaleString('en-IN')}` : <span className="text-gray-400 font-normal italic">Hidden</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{availableCount}/{totalCount} available</span>
                      </td>
                      <td className="px-6 py-4">
                        {item.allSold ? (
                          <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full">All Sold</span>
                        ) : item.isNew ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full">New</span>
                        ) : (
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500">
                          {[item.godown_number, item.rack_number, item.shelf].filter(Boolean).join(' → ') || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!item.allSold && (
                            <button
                              type="button"
                              onClick={() => handleQuickSoldAll(item.id)}
                              className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                            >
                              Sell All
                            </button>
                          )}
                          <Link
                            to={`/admin/item/${item.id}`}
                            onClick={() => handleItemClick(item.id)}
                            className="text-xs font-medium text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors"
                          >
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'large-grid' ? (
        /* LARGE SIZE GRID VIEW (Spacious cards with large images) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredItems.map(item => (
            <AdminInventoryCard
              key={item.id}
              item={item}
              isLarge={true}
              isHighlighted={highlightedItemId === item.id}
              onItemClick={handleItemClick}
              onQuickSoldAll={handleQuickSoldAll}
            />
          ))}
        </div>
      ) : (
        /* STANDARD GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <AdminInventoryCard
              key={item.id}
              item={item}
              isLarge={false}
              isHighlighted={highlightedItemId === item.id}
              onItemClick={handleItemClick}
              onQuickSoldAll={handleQuickSoldAll}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
