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

  const [imageBlocks, setImageBlocks] = useState([
    {
      id: Date.now().toString(),
      imagePreview: null,
      file: null,
      colours: [{ id: Date.now().toString() + 'c', name: '', hex: '#4F46E5', sizes: [] }]
    }
  ]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Collections
  const [allCollections, setAllCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollection, setShowNewCollection] = useState(false);

  // Camera
  const [cameraBlockId, setCameraBlockId] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    setAllCollections(DS.getCollections());
    const unsub = DS.subscribe('collections', () => setAllCollections(DS.getCollections()));
    return unsub;
  }, []);

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

  // Image Block Management
  const addImageBlock = () => {
    setImageBlocks(prev => [...prev, {
      id: Date.now().toString(),
      imagePreview: null,
      file: null,
      colours: [{ id: Date.now().toString() + 'c', name: '', hex: '#6366F1', sizes: [] }]
    }]);
  };

  const removeImageBlock = (blockId) => {
    if (imageBlocks.length <= 1) return;
    if (cameraBlockId === blockId) closeCamera();
    setImageBlocks(prev => prev.filter(b => b.id !== blockId));
  };

  const handleImageChange = (blockId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [`image_${blockId}`]: 'Max file size is 5MB' }));
      return;
    }
    const url = URL.createObjectURL(file);
    setImageBlocks(prev => prev.map(b => b.id === blockId ? { ...b, imagePreview: url, file } : b));
    setErrors(prev => { const next = { ...prev }; delete next[`image_${blockId}`]; return next; });
  };

  // Colour Management inside an Image Block
  const addColourToBlock = (blockId) => {
    setImageBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        colours: [...b.colours, { id: Date.now().toString() + 'c', name: '', hex: '#6366F1', sizes: [] }]
      };
    }));
  };

  const removeColourFromBlock = (blockId, colourId) => {
    setImageBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      if (b.colours.length <= 1) return b; // Keep at least one colour
      return {
        ...b,
        colours: b.colours.filter(c => c.id !== colourId)
      };
    }));
  };

  const updateColour = (blockId, colourId, key, val) => {
    setImageBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        colours: b.colours.map(c => c.id === colourId ? { ...c, [key]: val } : c)
      };
    }));
  };

  const toggleColourSize = (blockId, colourId, size) => {
    setImageBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        colours: b.colours.map(c => {
          if (c.id !== colourId) return c;
          const sizes = c.sizes.includes(size) ? c.sizes.filter(s => s !== size) : [...c.sizes, size];
          return { ...c, sizes };
        })
      };
    }));
  };

  // Camera functions
  const openCamera = async (blockId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCameraBlockId(blockId);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      console.error('Camera access denied:', err);
      setErrors(prev => ({ ...prev, [`image_${blockId}`]: 'Camera access denied. Please allow camera permissions.' }));
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !cameraBlockId) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = URL.createObjectURL(file);
      setImageBlocks(prev => prev.map(b => b.id === cameraBlockId ? { ...b, imagePreview: url, file } : b));
      closeCamera();
    }, 'image/jpeg', 0.9);
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraBlockId(null);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Item name is required';
    if (form.occasions.length === 0) errs.occasions = 'Select at least one occasion';
    
    imageBlocks.forEach((block, bIdx) => {
      if (!block.file && !block.imagePreview) {
        errs[`image_${block.id}`] = 'Please upload or capture an image';
      }
      block.colours.forEach((c, cIdx) => {
        if (!c.name.trim()) errs[`colour_name_${block.id}_${c.id}`] = 'Colour name is required';
        if (c.sizes.length === 0) errs[`colour_sizes_${block.id}_${c.id}`] = 'Select at least one size';
      });
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
      console.log('[AddNewItem] Starting upload for', imageBlocks.length, 'image block(s)');
      const uploadedBlocks = await Promise.all(imageBlocks.map(async (block, idx) => {
        let finalUrl = '';
        let publicId = '';
        if (block.file) {
          console.log(`[AddNewItem] Uploading block ${idx + 1}, file: ${block.file.name} (${(block.file.size / 1024).toFixed(1)}KB)`);
          const res = await DS.uploadImage(block.file);
          finalUrl = res.url;
          publicId = res.public_id;
          console.log(`[AddNewItem] Upload success. URL: ${finalUrl}, public_id: ${publicId}`);
        } else {
          console.warn(`[AddNewItem] Block ${idx + 1} has no file to upload!`);
        }
        return { ...block, finalUrl, publicId };
      }));

      // 2. Build colour × size variants
      const colourSizeVariants = [];
      uploadedBlocks.forEach(block => {
        block.colours.forEach(c => {
          c.sizes.forEach(size => {
            colourSizeVariants.push({
              colour_name: c.name,
              colour_hex: c.hex,
              size,
              image_url: block.finalUrl || `https://placehold.co/400x500/EEF2FF/4F46E5?text=${encodeURIComponent(c.name)}`,
              cloudinary_public_id: block.publicId || null
            });
          });
        });
      });

      console.log('[AddNewItem] Built', colourSizeVariants.length, 'variants. Sample image_url:', colourSizeVariants[0]?.image_url?.substring(0, 60));

      // 3. Save to database
      await DS.addItem({
        ...form,
        price: form.price ? parseFloat(form.price) : null,
        colourSizeVariants,
      });

      setTimeout(() => navigate('/admin/inventory'), 300);
    } catch (err) {
      console.error('[AddNewItem] Submit failed:', err);
      setErrors({ form: `Upload/save failed: ${err.message}` });
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

          {/* Image Blocks & Colours */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Images & Colours</h2>
                <p className="text-xs text-gray-500 mt-0.5">Upload a photo, then add all colours shown in that photo.</p>
              </div>
              <button type="button" onClick={addImageBlock} className="btn-ghost text-sm text-brand-600">
                + Add Image Block
              </button>
            </div>

            <div className="space-y-8">
              {imageBlocks.map((block, bIdx) => (
                <div key={block.id} className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800">Image Block {bIdx + 1}</h3>
                    {imageBlocks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageBlock(block.id)}
                        className="text-sm text-red-500 hover:text-red-700 font-medium"
                      >
                        Remove Entire Block
                      </button>
                    )}
                  </div>

                  {/* Image Upload for this block */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Item Image *</label>

                    {/* Camera Modal */}
                    {cameraBlockId === block.id && (
                      <div className="mb-3 rounded-xl overflow-hidden border-2 border-brand-400 bg-black relative max-w-sm mx-auto">
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

                    <div className="flex items-start gap-4">
                      {block.imagePreview ? (
                        <div className="w-32 h-40 rounded-xl overflow-hidden border border-gray-200 shadow-sm shrink-0">
                          <img src={block.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-32 h-40 rounded-xl border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 shrink-0">
                          <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs">No Image</span>
                        </div>
                      )}

                      <div className="flex-1 flex flex-col gap-2">
                        <label className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-200 bg-white rounded-lg cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 transition-all text-sm font-medium text-gray-600">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => handleImageChange(block.id, e)}
                            className="hidden"
                          />
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          {block.imagePreview ? 'Change Photo' : 'Upload Photo'}
                        </label>

                        {cameraBlockId !== block.id && (
                          <button
                            type="button"
                            onClick={() => openCamera(block.id)}
                            className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-200 bg-white rounded-lg cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 transition-all text-sm font-medium text-gray-600"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Take Photo
                          </button>
                        )}
                        {errors[`image_${block.id}`] && <p className="text-red-500 text-xs">{errors[`image_${block.id}`]}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Colours for this block */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-700">Available Colours in this Photo</label>
                      <button type="button" onClick={() => addColourToBlock(block.id)} className="text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full">
                        + Add Colour
                      </button>
                    </div>

                    <div className="space-y-4">
                      {block.colours.map((colour, cIdx) => (
                        <div key={colour.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative">
                          {block.colours.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeColourFromBlock(block.id, colour.id)}
                              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 pr-8">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">Colour Name *</label>
                              <input
                                type="text"
                                value={colour.name}
                                onChange={(e) => updateColour(block.id, colour.id, 'name', e.target.value)}
                                className={`input-field ${errors[`colour_name_${block.id}_${colour.id}`] ? 'border-red-400' : ''}`}
                                placeholder="e.g., Navy Blue"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">Hex Code</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={colour.hex}
                                  onChange={(e) => updateColour(block.id, colour.id, 'hex', e.target.value)}
                                  className="w-10 h-10 rounded-lg cursor-pointer border-0 shrink-0"
                                />
                                <input
                                  type="text"
                                  value={colour.hex}
                                  onChange={(e) => updateColour(block.id, colour.id, 'hex', e.target.value)}
                                  className="input-field flex-1"
                                  placeholder="#4F46E5"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Available Sizes *</label>
                            <div className="flex flex-wrap gap-2">
                              {SIZES.map(size => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => toggleColourSize(block.id, colour.id, size)}
                                  className={`size-pill ${colour.sizes.includes(size) ? 'size-pill-selected' : 'size-pill-available'}`}
                                >
                                  {size === 'free_size' ? 'Free Size' : size}
                                </button>
                              ))}
                            </div>
                            {errors[`colour_sizes_${block.id}_${colour.id}`] && <p className="text-red-500 text-xs mt-1">{errors[`colour_sizes_${block.id}_${colour.id}`]}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
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
            <button type="submit" disabled={isSubmitting} className="btn-primary py-3">
              {isSubmitting ? 'Uploading & Saving...' : 'Add Item to Catalog'}
            </button>
            <button type="button" onClick={() => navigate('/admin/inventory')} className="btn-secondary py-3">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
