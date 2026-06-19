import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../components/Header';
import ItemCard from '../../components/ItemCard';
import { useSession } from '../../contexts/SessionContext';
import * as DS from '../../services/DataService';

const TYPE_LABELS = {
  top: 'Top', bottom: 'Bottom', shorts: 'Shorts', long_dress: 'Long Dress',
  coord_set: 'Coord Set', kurti: 'Kurti', other: 'Others',
};

export default function ItemDetail() {
  const { id } = useParams();
  const { addToShortlist, isInShortlist, trackActivity } = useSession();
  const [item, setItem] = useState(null);
  const [selectedColour, setSelectedColour] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  useEffect(() => {
    const loaded = DS.getItemById(id);
    setItem(loaded);
    if (loaded && loaded.colours.length > 0) {
      setSelectedColour(loaded.colours[0]);
    }
    trackActivity();
  }, [id, trackActivity]);

  const similarItems = useMemo(() => {
    return DS.getSimilarItems(id, 6);
  }, [id]);

  const sizeGuideData = useMemo(() => {
    if (!item) return null;
    const guide = DS.getSizeGuideData();
    return guide[TYPE_LABELS[item.type]] || guide['Top'];
  }, [item]);

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-32">
          <p className="text-gray-500">Item not found</p>
        </div>
      </div>
    );
  }

  const currentImage = DS.getOptimizedImageUrl(
    selectedColour?.image_url || 'https://picsum.photos/seed/placeholder/600/750',
    800,
    75
  );

  // Get sizes available for selected colour
  const sizesForColour = item.variants
    .filter(v => selectedColour && v.colour_hex === selectedColour.hex)
    .reduce((acc, v) => {
      acc[v.size] = v;
      return acc;
    }, {});

  const handleAddToShortlist = () => {
    if (!selectedVariant) {
      // Pick first available variant for selected colour
      const firstAvailable = item.variants.find(
        v => selectedColour && v.colour_hex === selectedColour.hex && v.status === 'available'
      );
      if (firstAvailable) {
        const result = addToShortlist(item.id, firstAvailable.id);
        if (result) {
          setAddedFeedback(true);
          setTimeout(() => setAddedFeedback(false), 2000);
        }
      }
    } else {
      const result = addToShortlist(item.id, selectedVariant.id);
      if (result) {
        setAddedFeedback(true);
        setTimeout(() => setAddedFeedback(false), 2000);
      }
    }
  };

  const canAdd = item.variants.some(v =>
    selectedColour && v.colour_hex === selectedColour.hex && v.status === 'available' &&
    !isInShortlist(v.id)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/catalog" className="hover:text-brand-600 transition-colors">Catalog</Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">{item.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div className="animate-fade-in">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 shadow-xl">
              <img
                src={currentImage}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = `https://placehold.co/600x750/EEF2FF/4F46E5?text=${encodeURIComponent(item.name)}`;
                }}
              />
              {item.isNew && !item.allSold && <span className="badge-new">NEW</span>}
              {item.allSold && <div className="badge-sold" />}
            </div>
          </div>

          {/* Details */}
          <div className="animate-slide-up">
            {/* Type tag */}
            <span className="inline-block px-3 py-1 bg-brand-50 text-brand-700 text-sm font-semibold rounded-full mb-3">
              {TYPE_LABELS[item.type] || item.type}
            </span>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{item.name}</h1>

            <p className="text-3xl font-bold text-gradient mb-6">
              ₹{item.price?.toLocaleString('en-IN')}
            </p>

            {/* Occasion tags */}
            {item.occasions && item.occasions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {item.occasions.map(occ => (
                  <span key={occ} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full capitalize">
                    {occ}
                  </span>
                ))}
              </div>
            )}

            {/* Fabric */}
            {item.fabric && (
              <div className="mb-6">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Fabric</span>
                <p className="text-gray-900 mt-1">{item.fabric}</p>
              </div>
            )}

            {/* Colour selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Colour: <span className="text-gray-900 capitalize">{selectedColour?.name}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {item.colours.map(c => {
                  const allVariantsForColour = item.variants.filter(v => v.colour_hex === c.hex);
                  const isSold = allVariantsForColour.length > 0 && allVariantsForColour.every(v => v.status === 'sold');
                  return (
                    <button
                      key={c.hex}
                      onClick={() => { setSelectedColour(c); setSelectedVariant(null); }}
                      title={c.name}
                      className={`colour-swatch ${
                        selectedColour?.hex === c.hex ? 'colour-swatch-selected' : ''
                      } ${isSold ? 'colour-swatch-sold' : ''}`}
                      style={{ backgroundColor: c.hex }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Size selector */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Size</span>
                <button
                  onClick={() => setShowSizeGuide(!showSizeGuide)}
                  className="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors"
                >
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.sizes.map(size => {
                  const variant = sizesForColour[size];
                  const isSold = variant && variant.status === 'sold';
                  const isSelected = selectedVariant?.id === variant?.id;
                  const alreadyInList = variant && isInShortlist(variant.id);
                  return (
                    <button
                      key={size}
                      onClick={() => {
                        if (!isSold && variant) {
                          setSelectedVariant(isSelected ? null : variant);
                        }
                      }}
                      disabled={isSold}
                      className={`size-pill ${
                        isSold ? 'size-pill-sold' :
                        isSelected ? 'size-pill-selected' :
                        'size-pill-available'
                      } ${alreadyInList ? 'ring-2 ring-emerald-400' : ''}`}
                    >
                      {size === 'free_size' ? 'Free Size' : size}
                      {alreadyInList && ' ✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Guide Inline */}
            {showSizeGuide && sizeGuideData && (
              <div className="mb-8 p-4 bg-brand-50 rounded-xl border border-brand-100 animate-slide-up">
                <h4 className="font-semibold text-brand-900 mb-3">Size Guide — {TYPE_LABELS[item.type]}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {sizeGuideData.headers.map(h => (
                          <th key={h} className="px-3 py-2 text-left text-brand-700 font-semibold border-b border-brand-200">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sizeGuideData.rows.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white/50' : ''}>
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 text-gray-700 border-b border-brand-100">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Add to Shortlist */}
            <button
              onClick={handleAddToShortlist}
              disabled={!canAdd}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                addedFeedback
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : canAdd
                    ? 'btn-primary'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {addedFeedback ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Added to Shortlist!
                </span>
              ) : canAdd ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Add to Shortlist
                </span>
              ) : (
                'All variants in shortlist or sold out'
              )}
            </button>
          </div>
        </div>

        {/* Similar Items */}
        {similarItems.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Items</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
              {similarItems.map(si => (
                <div key={si.id} className="w-56 shrink-0 snap-start">
                  <ItemCard item={si} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
