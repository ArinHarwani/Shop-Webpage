import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import ConfirmDialog from '../../components/ConfirmDialog';
import * as DS from '../../services/DataService';

const EDIT_TYPES = [
  { value: 'top', label: 'Tops' },
  { value: 'one_piece', label: 'One Piece' },
  { value: 'long_dress', label: 'Long Dress' },
  { value: 'coord_set', label: 'Coord Set' },
  { value: 'kurti', label: 'Kurti' },
  { value: 'bottom', label: 'Bottoms' },
  { value: 'shorts', label: 'Shorts' },
  { value: 'other', label: 'Others' },
];

const TYPE_LABELS = {
  top: 'Tops',
  tops: 'Tops',
  bottom: 'Bottoms',
  bottoms: 'Bottoms',
  shorts: 'Shorts',
  long_dress: 'Long Dress',
  one_piece: 'One Piece',
  one_piece_dresses: 'One Piece & Dresses',
  coord_set: 'Coord Set',
  coord_ethnic: 'Coord Sets & Ethnic Fashion',
  traditional: 'Ethnic & Traditional',
  kurti: 'Kurti',
  other: 'Others',
  others: 'Others',
};
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'free_size'];

export default function AdminItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsub = DS.subscribe('item_variants', () => setRefreshKey(k => k + 1));
    return unsub;
  }, []);

  useEffect(() => {
    const loaded = DS.getItemById(id);
    setItem(loaded);
    if (loaded) {
      setEditForm({
        name: loaded.name || '',
        type: loaded.type || 'other',
        godown_number: loaded.godown_number || '',
        rack_number: loaded.rack_number || '',
        shelf: loaded.shelf || '',
        internal_notes: loaded.internal_notes || '',
      });
    }
  }, [id, refreshKey]);

  const [isDeletingVariant, setIsDeletingVariant] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState(null);

  // Add New Variant State
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [isUploadingVariant, setIsUploadingVariant] = useState(false);
  const [addVariantError, setAddVariantError] = useState('');
  const [newVariantBlock, setNewVariantBlock] = useState({
    imagePreview: null,
    file: null,
    colours: [{ id: Date.now().toString() + 'c', name: '', hex: '#4F46E5', sizes: [] }]
  });

  if (!item) {
    return (
      <AdminLayout>
        <div className="text-center py-24">
          <p className="text-gray-500">Item not found</p>
          <Link to="/admin/inventory" className="btn-primary mt-4 inline-flex">Back to Inventory</Link>
        </div>
      </AdminLayout>
    );
  }

  const handleToggleVariant = (variantId, currentStatus) => {
    DS.updateVariantStatus(variantId, currentStatus === 'sold' ? 'available' : 'sold');
  };

  const handleSaveNotes = () => {
    DS.updateItem(id, editForm);
    setIsEditing(false);
    setRefreshKey(k => k + 1);
  };

  const handleDeleteItem = async () => {
    // Collect all variants with public_id and cloud_name
    const targetsToDelete = item.variants
      .filter(v => v.cloudinary_public_id)
      .map(v => ({
        publicId: v.cloudinary_public_id,
        cloudName: v.cloudinary_cloud_name
      }));
    
    if (targetsToDelete.length > 0) {
      const result = await DS.deleteCloudinaryImages(targetsToDelete);
      if (result !== true && !result?.success) {
        const errorMsg = result?.error || 'Unknown error';
        alert(`Cloudinary deletion failed:\n\n${errorMsg}\n\nDatabase deletion aborted to prevent orphaned files.`);
        setShowDeleteDialog(false);
        return;
      }
    } else {
      console.warn("[Delete Item] No cloudinary_public_id found on any variant — images won't be deleted from Cloudinary.");
    }
    
    await DS.deleteItem(id);
    navigate('/admin/inventory');
  };

  const handleDeleteColour = async (group) => {
    setVariantToDelete(group);
  };

  const confirmDeleteColour = async () => {
    if (!variantToDelete) return;
    setIsDeletingVariant(true);

    const publicId = variantToDelete.image_public_id;
    const cloudName = variantToDelete.cloudinary_cloud_name;
    const variantsToRemove = variantToDelete.variants;
    
    // Check if any other color in this item uses the same image
    let isImageUsedElsewhere = false;
    if (publicId) {
      isImageUsedElsewhere = item.variants.some(v => 
        v.cloudinary_public_id === publicId && 
        v.colour_hex !== variantToDelete.colour_hex
      );
    }

    if (publicId && !isImageUsedElsewhere) {
      const result = await DS.deleteCloudinaryImages([{ publicId, cloudName }]);
      if (result !== true && !result?.success) {
        const errorMsg = result?.error || 'Unknown error';
        alert(`Cloudinary deletion failed:\n\n${errorMsg}\n\nColour removal aborted.`);
        setIsDeletingVariant(false);
        setVariantToDelete(null);
        return;
      }
    }

    // Delete variants from DB
    for (const v of variantsToRemove) {
      await DS.deleteVariant(v.id);
    }

    setIsDeletingVariant(false);
    setVariantToDelete(null);
    setRefreshKey(k => k + 1);
  };

  const handleAddNewVariants = async () => {
    setAddVariantError('');
    if (!newVariantBlock.file && !newVariantBlock.imagePreview) {
      setAddVariantError('Please select an image.');
      return;
    }
    for (const c of newVariantBlock.colours) {
      if (!c.name.trim()) return setAddVariantError('All colours must have a name.');
      if (c.sizes.length === 0) return setAddVariantError(`Please select at least one size for ${c.name || 'a colour'}.`);
    }

    setIsUploadingVariant(true);
    try {
      let finalUrl = '';
      let publicId = '';
      let cloudName = '';
      if (newVariantBlock.file) {
        const res = await DS.uploadImage(newVariantBlock.file, item.type);
        finalUrl = res.url;
        publicId = res.public_id;
        cloudName = res.cloud_name;
      }

      const colourSizeVariants = [];
      newVariantBlock.colours.forEach(c => {
        c.sizes.forEach(size => {
          colourSizeVariants.push({
            colour_name: c.name,
            colour_hex: c.hex,
            size,
            image_url: finalUrl || `https://placehold.co/400x500/EEF2FF/4F46E5?text=${encodeURIComponent(c.name)}`,
            cloudinary_public_id: publicId || null,
            cloudinary_cloud_name: cloudName || null,
          });
        });
      });

      await DS.addVariantsToItem(id, colourSizeVariants);
      setIsAddingVariant(false);
      setNewVariantBlock({
        imagePreview: null,
        file: null,
        colours: [{ id: Date.now().toString() + 'c', name: '', hex: '#4F46E5', sizes: [] }]
      });
      setRefreshKey(k => k + 1);
    } catch (err) {
      setAddVariantError(err.message || 'Failed to add variants');
    } finally {
      setIsUploadingVariant(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAddVariantError('Max file size is 5MB');
      return;
    }
    const url = URL.createObjectURL(file);
    setNewVariantBlock(prev => ({ ...prev, imagePreview: url, file }));
    setAddVariantError('');
  };

  // Group variants by colour
  const variantsByColour = {};
  item.variants.forEach(v => {
    if (!variantsByColour[v.colour_hex]) {
      variantsByColour[v.colour_hex] = { 
        colour_name: v.colour_name, 
        colour_hex: v.colour_hex, 
        image_url: v.image_url, 
        image_public_id: v.cloudinary_public_id,
        cloudinary_cloud_name: v.cloudinary_cloud_name,
        variants: [] 
      };
    }
    variantsByColour[v.colour_hex].variants.push(v);
  });

  return (
    <AdminLayout>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/admin/inventory" className="hover:text-brand-600 transition-colors">Inventory</Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">{item.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Item Header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-brand-50 text-brand-700 text-sm font-semibold rounded-full">
                    {TYPE_LABELS[item.type] || item.type}
                  </span>
                  {item.isNew && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full">NEW</span>
                  )}
                  {item.allSold && (
                    <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full">ALL SOLD</span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
                <p className="text-2xl font-bold text-gradient mt-1">₹{item.price?.toLocaleString('en-IN')}</p>
              </div>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="btn-danger text-sm"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {item.occasions?.map(occ => (
                <span key={occ} className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full capitalize">{occ}</span>
              ))}
            </div>
            {item.fabric && <p className="text-sm text-gray-500">Fabric: <span className="text-gray-700">{item.fabric}</span></p>}
            <p className="text-xs text-gray-400 mt-2">Added {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>

          {/* Variant Management */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Variants (Colour × Size)</h2>
              <button
                onClick={() => setIsAddingVariant(!isAddingVariant)}
                className="btn-ghost text-sm text-brand-600"
              >
                {isAddingVariant ? 'Cancel Adding' : '+ Add Image & Colours'}
              </button>
            </div>
            
            {isAddingVariant && (
              <div className="mb-6 p-5 border border-brand-200 bg-brand-50 rounded-xl space-y-4">
                <h3 className="font-bold text-brand-900">Add New Variants</h3>
                {addVariantError && <p className="text-red-600 text-sm">{addVariantError}</p>}
                
                <div className="flex gap-4 items-start">
                  {newVariantBlock.imagePreview ? (
                    <img src={newVariantBlock.imagePreview} className="w-24 h-32 object-cover rounded-lg border border-gray-200" />
                  ) : (
                    <div className="w-24 h-32 bg-white rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">No Image</div>
                  )}
                  <div>
                    <label className="btn-secondary text-sm px-3 py-1.5 cursor-pointer inline-block mb-2">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      Upload Photo
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">Colours</label>
                    <button
                      type="button"
                      onClick={() => setNewVariantBlock(prev => ({
                        ...prev, colours: [...prev.colours, { id: Date.now().toString() + 'c', name: '', hex: '#4F46E5', sizes: [] }]
                      }))}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 bg-white px-2 py-1 rounded"
                    >
                      + Add Colour
                    </button>
                  </div>
                  {newVariantBlock.colours.map(c => (
                    <div key={c.id} className="bg-white p-3 rounded-lg border border-gray-200 relative">
                      {newVariantBlock.colours.length > 1 && (
                        <button
                          onClick={() => setNewVariantBlock(prev => ({ ...prev, colours: prev.colours.filter(col => col.id !== c.id) }))}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        >×</button>
                      )}
                      <div className="flex gap-3 mb-2 pr-6">
                        <div className="flex-1">
                          <input type="text" value={c.name} onChange={(e) => setNewVariantBlock(prev => ({
                            ...prev, colours: prev.colours.map(col => col.id === c.id ? { ...col, name: e.target.value } : col)
                          }))} placeholder="Colour Name" className="input-field py-1 px-2 text-sm" />
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="color" value={c.hex} onChange={(e) => setNewVariantBlock(prev => ({
                            ...prev, colours: prev.colours.map(col => col.id === c.id ? { ...col, hex: e.target.value } : col)
                          }))} className="w-8 h-8 rounded border-0 p-0 cursor-pointer" />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {SIZES.map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setNewVariantBlock(prev => ({
                              ...prev, colours: prev.colours.map(col => {
                                if (col.id !== c.id) return col;
                                const sizes = col.sizes.includes(size) ? col.sizes.filter(s => s !== size) : [...col.sizes, size];
                                return { ...col, sizes };
                              })
                            }))}
                            className={`px-2 py-0.5 text-xs rounded-full border ${c.sizes.includes(size) ? 'bg-brand-600 text-white border-brand-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                          >
                            {size === 'free_size' ? 'Free' : size}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button onClick={handleAddNewVariants} disabled={isUploadingVariant} className="btn-primary py-2 w-full">
                    {isUploadingVariant ? 'Uploading...' : 'Save New Variants'}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {Object.values(variantsByColour).map(group => (
                <div key={group.colour_hex} className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ backgroundColor: group.colour_hex }} />
                      <span className="font-medium text-gray-900">{group.colour_name}</span>
                      <span className="text-xs text-gray-400">
                        {group.variants.filter(v => v.status === 'available').length}/{group.variants.length} available
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteColour(group)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1"
                    >
                      Remove Colour
                    </button>
                  </div>
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {group.variants.map(v => (
                      <button
                        key={v.id}
                        onClick={() => handleToggleVariant(v.id, v.status)}
                        className={`px-4 py-3 rounded-xl border-2 text-center transition-all duration-200 ${
                          v.status === 'sold'
                            ? 'border-red-200 bg-red-50 text-red-600'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
                        }`}
                      >
                        <span className="block text-sm font-bold">{v.size === 'free_size' ? 'Free' : v.size}</span>
                        <span className="block text-xs mt-0.5">{v.status === 'sold' ? '✕ Sold' : '✓ Available'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar — Admin-only fields */}
        <div className="space-y-6">
          {/* Image preview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="aspect-[4/5] bg-gray-100">
              <img
                src={DS.getOptimizedImageUrl(item.colours?.[0]?.image_url, 600, 'auto')}
                alt={item.name}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.target.src = `https://placehold.co/400x500/EEF2FF/4F46E5?text=${encodeURIComponent(item.name)}`;
                }}
              />
            </div>
          </div>

          {/* Godown & Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Admin Details</h3>
              <button
                onClick={() => {
                  if (isEditing) handleSaveNotes();
                  else setIsEditing(true);
                }}
                className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                {isEditing ? 'Save' : 'Edit'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input-field mt-1"
                    placeholder="e.g., Floral Wrap Dress"
                  />
                ) : (
                  <p className="text-gray-900 mt-1">{item.name || '—'}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Category</label>
                {isEditing ? (
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    className="select-field mt-1"
                  >
                    {EDIT_TYPES.map(({ value: val, label }) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 mt-1">{TYPE_LABELS[item.type] || item.type}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Godown Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.godown_number}
                    onChange={(e) => setEditForm({ ...editForm, godown_number: e.target.value })}
                    className="input-field mt-1"
                    placeholder="e.g., GD-1"
                  />
                ) : (
                  <p className="text-gray-900 mt-1">{item.godown_number || '—'}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rack Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.rack_number}
                    onChange={(e) => setEditForm({ ...editForm, rack_number: e.target.value })}
                    className="input-field mt-1"
                    placeholder="e.g., R-3"
                  />
                ) : (
                  <p className="text-gray-900 mt-1">{item.rack_number || '—'}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Shelf / Section</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.shelf}
                    onChange={(e) => setEditForm({ ...editForm, shelf: e.target.value })}
                    className="input-field mt-1"
                    placeholder="e.g., A"
                  />
                ) : (
                  <p className="text-gray-900 mt-1">{item.shelf || '—'}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Internal Notes</label>
                {isEditing ? (
                  <textarea
                    value={editForm.internal_notes}
                    onChange={(e) => setEditForm({ ...editForm, internal_notes: e.target.value })}
                    className="input-field mt-1"
                    rows={3}
                    placeholder="Supplier, cost price, etc."
                  />
                ) : (
                  <p className="text-gray-700 mt-1 text-sm whitespace-pre-wrap">{item.internal_notes || '—'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation for Item */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Remove Item Permanently"
        message="This will remove the item from the catalog completely, and delete all associated photos from Cloudinary. This cannot be undone."
        confirmLabel="Remove Permanently"
        onConfirm={handleDeleteItem}
        onCancel={() => setShowDeleteDialog(false)}
        danger
      />

      {/* Delete Confirmation for Variant Group */}
      <ConfirmDialog
        isOpen={!!variantToDelete}
        title="Remove Colour Variant"
        message={`This will remove the colour "${variantToDelete?.colour_name}" and all its sizes. If this is the only colour using its photo, the photo will also be deleted from Cloudinary. This cannot be undone.`}
        confirmLabel={isDeletingVariant ? "Removing..." : "Remove Colour"}
        onConfirm={confirmDeleteColour}
        onCancel={() => setVariantToDelete(null)}
        danger
      />
    </AdminLayout>
  );
}
