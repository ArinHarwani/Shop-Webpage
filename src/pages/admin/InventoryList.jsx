import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import * as DS from '../../services/DataService';

const TYPE_LABELS = {
  top: 'Top', bottom: 'Bottom', shorts: 'Shorts', long_dress: 'Long Dress',
  coord_set: 'Coord Set', kurti: 'Kurti', other: 'Others',
};

export default function InventoryList() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsub = DS.subscribe('items', () => setRefreshKey(k => k + 1));
    const unsub2 = DS.subscribe('item_variants', () => setRefreshKey(k => k + 1));
    return () => { unsub(); unsub2(); };
  }, []);

  useEffect(() => {
    const filters = {};
    if (filterType !== 'All') filters.type = filterType;
    setItems(DS.getItems(filters));
  }, [filterType, refreshKey]);

  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.fabric || '').toLowerCase().includes(q)
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

  const handleQuickSoldAll = (itemId) => {
    const variants = DS.getVariants(itemId);
    variants.forEach(v => {
      if (v.status === 'available') {
        DS.updateVariantStatus(v.id, 'sold');
      }
    });
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 mt-1">{filteredItems.length} items</p>
        </div>
        <Link to="/admin/add-item" className="btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Item
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
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
                placeholder="Search items..."
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select-field w-auto min-w-[140px]"
          >
            <option value="All">All Types</option>
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
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
            className="select-field w-auto min-w-[140px]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-high">Price: High to Low</option>
            <option value="price-low">Price: Low to High</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">No items match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Variants</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredItems.map(item => {
                  const availableCount = item.variants.filter(v => v.status === 'available').length;
                  const totalCount = item.variants.length;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/admin/item/${item.id}`} className="flex items-center gap-3 group">
                          <div className="w-12 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            <img
                              src={item.colours?.[0]?.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = `https://placehold.co/120x140/EEF2FF/4F46E5?text=?`;
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-brand-600 transition-colors">{item.name}</p>
                            <div className="flex gap-1 mt-1">
                              {item.colours?.slice(0, 4).map(c => (
                                <div key={c.hex} className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: c.hex }} />
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
                        <span className="text-sm font-semibold text-gray-900">₹{item.price?.toLocaleString('en-IN')}</span>
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
                              onClick={() => handleQuickSoldAll(item.id)}
                              className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                            >
                              Sell All
                            </button>
                          )}
                          <Link
                            to={`/admin/item/${item.id}`}
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
        )}
      </div>
    </AdminLayout>
  );
}
