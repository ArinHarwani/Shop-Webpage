import React, { useState, useEffect, useRef } from 'react';
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
    collections: [],
  });
  const [colours, setColours] = useState([{ name: '', hex: '#4F46E5', sizes: [], imagePreview: null, file: null }]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Collections
  const [allCollections, setAllCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollection, setShowNewCollection] = useState(false);

  // Camera
  const [cameraIdx, setCameraIdx] = useState(null); // which colour index is using camera
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    setAllCollections(DS.getCollections());
    const unsub = DS.subscribe('collections', () => setAllCollections(DS.getCollections()));
    return unsub;
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleOccasion = (occ) => {
    setForm(prev => ({
      ...prev,
      occasions: prev.occasions.includes(occ)
        ? prev.occasions.filter(o => o !== occ)
        : [...prev.occasions, occ],
    }));
  };

  const toggleCollection = (name) => {
    setForm(prev => ({
      ...prev,
      collections: prev.collections.includes(name)
        ? prev.collections.filter(c => c !== name)
        : [...prev.collections, name],
    }));
  };

  const handleAddCollection = async () => {
    if (!newCollectionName.trim()) return;
    const result = await DS.addCollection(newCollectionName);
    if (result) {
      setForm(prev => ({ ...prev, collections: [...prev.collections, result.name] }));
    }
    setNewCollectionName('');
    setShowNewCollection(false);
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
    setColours(prev => [...prev, { name: '', hex: '#6366F1', sizes: [], imagePreview: null, file: null }]);
  };

  const removeColour = (idx) => {
    if (colours.length <= 1) return;
    // Close camera if open for this colour
    if (cameraIdx === idx) closeCamera();
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

  // Camera functions
  const openCamera = async (idx) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCameraIdx(idx);
      // Wait for next render so videoRef is available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      console.error('Camera access denied:', err);
      setErrors(prev => ({ ...prev, [`image_${idx}`]: 'Camera access denied. Please allow camera permissions.' }));
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || cameraIdx === null) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = URL.createObjectURL(file);
      updateColour(cameraIdx, 'imagePreview', url);
      updateColour(cameraIdx, 'file', file);
      closeCamera();
    }, 'image/jpeg', 0.9);
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraIdx(null);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Item name is required';
    // Price is now OPTIONAL — no validation needed
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
        let finalUrl = '';
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
            image_url: c.finalUrl || `https://placehold.co/400x500/EEF2FF/4F46E5?text=${encodeURIComponent(c.name)}`,
          });
        });
      });

      // 3. Save to database (price can be null)
      await DS.addItem({
        ...form,
        price: form.price ? parseFloat(form.price) : null,
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

        {errors.form && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {errors.form}
          </div>
        )}

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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Price (₹) <span className="text-gray-400 font-normal text-xs">Optional — hidden from customer if blank</span>
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => updateForm('price', e.target.value)}
                    className="input-field"
                    placeholder="Leave blank to hide from customers"
                    min="0"
                    step="1"
                  />
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

          {/* Collections */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Collections</h2>
                <p className="text-xs text-gray-500 mt-0.5">Organize items into custom folders</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCollection(!showNewCollection)}
                className="btn-ghost text-sm text-brand-600"
              >
                + New Collection
              </button>
            </div>

            {showNewCollection && (
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCollection())}
                  className="input-field flex-1"
                  placeholder="e.g., Summer Fit, Instagram Worthy..."
                  autoFocus
                />
                <button type="button" onClick={handleAddCollection} className="btn-primary text-sm px-4 py-2">
                  Add
                </button>
                <button type="button" onClick={() => { setShowNewCollection(false); setNewCollectionName(''); }} className="btn-ghost text-sm px-3 py-2">
                  Cancel
                </button>
              </div>
            )}

            {allCollections.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allCollections.map(col => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => toggleCollection(col.name)}
                    className={`filter-chip ${form.collections.includes(col.name) ? 'filter-chip-active' : 'filter-chip-inactive'}`}
                  >
                    {col.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No collections yet. Create one above!</p>
            )}
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

                    {/* Camera Modal */}
                    {cameraIdx === idx && (
                      <div className="mb-3 rounded-xl overflow-hidden border-2 border-brand-400 bg-black relative">
                        <video ref={videoRef} className="w-full aspect-[4/3] object-cover" autoPlay playsInline muted />
                        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="w-14 h-14 bg-white rounded-full border-4 border-brand-500 shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
                          >
                            <div className="w-10 h-10 bg-brand-500 rounded-full" />
                          </button>
                          <button
                            type="button"
                            onClick={closeCamera}
                            className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
                          >
                            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      {colour.imagePreview && (
                        <div className="w-16 h-20 rounded-lg overflow-hidden bg-gray-100">
                          <img src={colour.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Upload from file */}
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
                          <span className="text-xs text-gray-500">Upload JPG/PNG</span>
                        </div>
                      </label>

                      {/* Camera button */}
                      {cameraIdx !== idx && (
                        <button
                          type="button"
                          onClick={() => openCamera(idx)}
                          className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 transition-all"
                        >
                          <div className="text-center">
                            <svg className="w-6 h-6 text-gray-400 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-xs text-gray-500">Camera</span>
                          </div>
                        </button>
                      )}
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
              {isSubmitting ? 'Uploading & Saving...' : 'Add Item to Catalog'}
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
