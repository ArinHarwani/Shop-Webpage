import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import * as DS from '../../services/DataService';

const TYPES = [
  { value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' },
  { value: 'shorts', label: 'Shorts' }, { value: 'long_dress', label: 'Long Dress' },
  { value: 'coord_set', label: 'Coord Set' }, { value: 'kurti', label: 'Kurti' },
  { value: 'other', label: 'Others' },
];
const OCCASIONS = ['casual', 'festive', 'office', 'party', 'wedding'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'free_size'];

export default function AddNewItem() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', type: 'top', occasions: [], price: '', fabric: '',
    godown_number: '', rack_number: '', shelf: '', internal_notes: '',
  });
  const [colours, setColours] = useState([{ name: '', hex: '#4F46E5', sizes: [], imagePreview: null, file: null, imageUrl: '' }]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleOccasion = (occ) => {
    setForm(prev => ({
      ...prev,
      occasions: prev.occasions.includes(occ)
        ? prev.occasions.filter(o => o !== occ)
        : [...prev.occasions, occ],
    }));
  };

  const updateColour = (idx, key, val) => {
    setColours(prev => prev.map((c, i) => i === idx ? { ...c, [key]: val } : c));
  };

  const toggleColourSize = (idx, size) => {
    setColours(prev => prev.map((c, i) => {
      if (i !== idx) return c;
      const sizes = c.sizes.includes(size) ? c.sizes.filter(s => s !== size) : [...c.sizes, size];
      return { ...c, sizes };
    }));
  };

  const addColour = () => {
    setColours(prev => [...prev, { name: '', hex: '#6366F1', sizes: [], imagePreview: null, file: null, imageUrl: '' }]);
  };

  const removeColour = (idx) => {
    if (colours.length <= 1) return;
    setColours(prev => prev.filter((_, i) => i !== idx));
  };

  const handleImageChange = (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [`image_${idx}`]: 'Max file size is 5MB' }));
      return;
    }
    const url = URL.createObjectURL(file);
    updateColour(idx, 'imagePreview', url);
    updateColour(idx, 'file', file);
    setErrors(prev => { const next = { ...prev }; delete next[`image_${idx}`]; return next; });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Item name is required';
    if (!form.price || parseFloat(form.price) <= 0) errs.price = 'Valid price is required';
    if (form.occasions.length === 0) errs.occasions = 'Select at least one occasion';
    colours.forEach((c, i) => {
      if (!c.name.trim()) errs[`colour_name_${i}`] = 'Colour name is required';
      if (c.sizes.length === 0) errs[`colour_sizes_${i}`] = 'Select at least one size';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      // 1. Upload images first
      const uploadedColours = await Promise.all(colours.map(async (c) => {
        let finalUrl = c.imageUrl;
        if (c.file) {
          finalUrl = await DS.uploadImage(c.file);
        }
        return { ...c, finalUrl };
      }));

      // 2. Build colour × size variants
      const colourSizeVariants = [];
      uploadedColours.forEach(c => {
        c.sizes.forEach(size => {
          colourSizeVariants.push({
            colour_name: c.name,
            colour_hex: c.hex,
            size,
            image_url: c.finalUrl || `https://picsum.photos/seed/${c.name.replace(/\s/g, '')}-${size}/400/500`,
          });
        });
      });

      // 3. Save to database
      await DS.addItem({
        ...form,
        price: parseFloat(form.price),
        colourSizeVariants,
      });

      setTimeout(() => navigate('/admin/inventory'), 300);
    } catch (err) {
      console.error(err);
      setErrors({ form: 'Failed to upload images or save item. Check console for details.' });
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Item</h1>
          <p className="text-gray-500 mt-1">Fill in the details to add a new product to the catalog</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  className={`input-field ${errors.name ? 'border-red-400' : ''}`}
                  placeholder="e.g., Floral Wrap Dress"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => updateForm('type', e.target.value)}
                    className="select-field"
                  >
                    {TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => updateForm('price', e.target.value)}
                    className={`input-field ${errors.price ? 'border-red-400' : ''}`}
                    placeholder="2499"
                    min="0"
                    step="1"
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Occasion *</label>
                <div className="flex flex-wrap gap-2">
                  {OCCASIONS.map(occ => (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => toggleOccasion(occ)}
                      className={`filter-chip ${form.occasions.includes(occ) ? 'filter-chip-active' : 'filter-chip-inactive'}`}
                    >
                      {occ.charAt(0).toUpperCase() + occ.slice(1)}
                    </button>
                  ))}
                </div>
                {errors.occasions && <p className="text-red-500 text-xs mt-1">{errors.occasions}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fabric / Material</label>
                <input
                  type="text"
                  value={form.fabric}
                  onChange={(e) => updateForm('fabric', e.target.value)}
                  className="input-field"
                  placeholder="e.g., Georgette, Cotton Blend"
                />
              </div>
            </div>
          </div>

          {/* Colours & Sizes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Colours & Sizes</h2>
              <button type="button" onClick={addColour} className="btn-ghost text-sm text-brand-600">
                + Add Colour
              </button>
            </div>

            <div className="space-y-6">
              {colours.map((colour, idx) => (
                <div key={idx} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Colour {idx + 1}</h4>
                    {colours.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColour(idx)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Colour Name *</label>
                      <input
                        type="text"
                        value={colour.name}
                        onChange={(e) => updateColour(idx, 'name', e.target.value)}
                        className={`input-field ${errors[`colour_name_${idx}`] ? 'border-red-400' : ''}`}
                        placeholder="e.g., Navy Blue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Hex Code</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={colour.hex}
                          onChange={(e) => updateColour(idx, 'hex', e.target.value)}
                          className="w-12 h-12 rounded-lg cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={colour.hex}
                          onChange={(e) => updateColour(idx, 'hex', e.target.value)}
                          className="input-field flex-1"
                          placeholder="#4F46E5"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Available Sizes *</label>
                    <div className="flex flex-wrap gap-2">
                      {SIZES.map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleColourSize(idx, size)}
                          className={`size-pill ${colour.sizes.includes(size) ? 'size-pill-selected' : 'size-pill-available'}`}
                        >
                          {size === 'free_size' ? 'Free Size' : size}
                        </button>
                      ))}
                    </div>
                    {errors[`colour_sizes_${idx}`] && <p className="text-red-500 text-xs mt-1">{errors[`colour_sizes_${idx}`]}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Image</label>
                    <div className="flex items-center gap-4">
                      {colour.imagePreview && (
                        <div className="w-16 h-20 rounded-lg overflow-hidden bg-gray-100">
                          <img src={colour.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 transition-all">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => handleImageChange(idx, e)}
                          className="hidden"
                        />
                        <div className="text-center">
                          <svg className="w-6 h-6 text-gray-400 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs text-gray-500">Upload JPG/PNG (max 5MB)</span>
                        </div>
                      </label>
                    </div>
                    {errors[`image_${idx}`] && <p className="text-red-500 text-xs mt-1">{errors[`image_${idx}`]}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Fields */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Admin-Only Details</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Godown #</label>
                <input
                  type="text"
                  value={form.godown_number}
                  onChange={(e) => updateForm('godown_number', e.target.value)}
                  className="input-field"
                  placeholder="GD-1"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Rack #</label>
                <input
                  type="text"
                  value={form.rack_number}
                  onChange={(e) => updateForm('rack_number', e.target.value)}
                  className="input-field"
                  placeholder="R-3"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Shelf</label>
                <input
                  type="text"
                  value={form.shelf}
                  onChange={(e) => updateForm('shelf', e.target.value)}
                  className="input-field"
                  placeholder="A"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Internal Notes</label>
              <textarea
                value={form.internal_notes}
                onChange={(e) => updateForm('internal_notes', e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Supplier name, cost price, reorder info..."
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Adding...' : 'Add Item to Catalog'}
            </button>
            <button type="button" onClick={() => navigate('/admin/inventory')} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
