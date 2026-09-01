import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../components/Header';
import ItemCard from '../../components/ItemCard';
import { useSession } from '../../contexts/SessionContext';
import * as DS from '../../services/DataService';

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
  coord_ethnic: 'Coord Sets & Ethnic',
  traditional: 'Ethnic & Traditional',
  kurti: 'Kurti',
  other: 'Others',
  others: 'Others',
};

// Cross-fading image with skeleton
function CrossFadeImage({ src, alt }) {
  const [displayedSrc, setDisplayedSrc] = useState(src);
  const [nextSrc, setNextSrc] = useState(null);
  const [fading, setFading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (src === displayedSrc) return;
    // Preload next image, then cross-fade
    const img = new Image();
    img.onload = () => {
      setNextSrc(src);
      setFading(true);
      setTimeout(() => {
        setDisplayedSrc(src);
        setNextSrc(null);
        setFading(false);
      }, 300);
    };
    img.src = src;
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full h-full">
      {!imgLoaded && <div className="absolute inset-0 skeleton" />}
      {/* Current image */}
      <img
        src={displayedSrc}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          fading ? 'opacity-0' : 'opacity-100'
        } ${imgLoaded ? '' : 'opacity-0'}`}
        onLoad={() => setImgLoaded(true)}
        onError={(e) => { e.target.style.opacity = 0.5; setImgLoaded(true); }}
        loading="eager"
        fetchpriority="high"
        decoding="async"
        width={800}
        height={1000}
      />
      {/* Next image (fades in) */}
      {nextSrc && (
        <img
          src={nextSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            fading ? 'opacity-100' : 'opacity-0'
          }`}
          loading="eager"
          decoding="async"
          width={800}
          height={1000}
        />
      )}
    </div>
  );
}

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
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id, trackActivity]);

  const similarItems = useMemo(() => DS.getSimilarItems(id, 6), [id]);

  const sizeGuideData = useMemo(() => {
    if (!item) return null;
    const guide = DS.getSizeGuideData();
    return guide[TYPE_LABELS[item.type]] || guide['Top'];
  }, [item]);

  if (!item) {
    return (
      <div className="min-h-screen bg-ivory">
        <Header />
        {/* Loading skeleton */}
        <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-[3/4] skeleton rounded-2xl" />
            <div className="space-y-4 pt-4">
              <div className="skeleton h-4 w-20 rounded-full" />
              <div className="skeleton h-10 w-3/4 rounded" />
              <div className="skeleton h-8 w-24 rounded" />
              <div className="skeleton h-4 w-full rounded mt-6" />
              <div className="skeleton h-4 w-2/3 rounded" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentImage = DS.getOptimizedImageUrl(
    selectedColour?.image_url || `https://placehold.co/800x1000/E8E0D5/9B8E85?text=${encodeURIComponent(item.name)}`,
    800,
    'auto'
  );

  const sizesForColour = item.variants
    .filter(v => selectedColour && v.colour_hex === selectedColour.hex)
    .reduce((acc, v) => { acc[v.size] = v; return acc; }, {});

  const handleAddToShortlist = async () => {
    if (!selectedVariant) {
      const firstAvailable = item.variants.find(
        v => selectedColour && v.colour_hex === selectedColour.hex && v.status === 'available'
      );
      if (firstAvailable) {
        const result = await addToShortlist(item.id, firstAvailable.id);
        if (result) { setAddedFeedback(true); setTimeout(() => setAddedFeedback(false), 2200); }
      }
    } else {
      const result = await addToShortlist(item.id, selectedVariant.id);
      if (result) { setAddedFeedback(true); setTimeout(() => setAddedFeedback(false), 2200); }
    }
  };

  const canAdd = item.variants.some(v =>
    selectedColour && v.colour_hex === selectedColour.hex && v.status === 'available' &&
    !isInShortlist(v.id)
  );

  return (
    <div className="min-h-screen bg-ivory">
      <Header />

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 pb-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate mb-6 animate-fade-up">
          <Link to="/catalog" className="hover:text-accent transition-colors">Catalog</Link>
          <svg className="w-3.5 h-3.5 text-dust" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-charcoal font-medium truncate max-w-[200px]">{item.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12">

          {/* ── Image ─────────────────────────────────── */}
          <div className="animate-fade-up">
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-stone/40 shadow-card-lg">
              <CrossFadeImage src={currentImage} alt={item.name} />
              {item.isNew && !item.allSold && <span className="badge-new">New</span>}
              {item.allSold && <div className="badge-sold" />}
            </div>
          </div>

          {/* ── Details ───────────────────────────────── */}
          <div className="animate-slide-up lg:pt-2">

            {/* Type + Item code */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">
                {TYPE_LABELS[item.type] || item.type}
              </span>
              {item.item_code && (
                <span className="px-2.5 py-1 bg-stone text-charcoal text-xs font-mono font-semibold rounded-lg">
                  {item.item_code}
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="font-display text-4xl sm:text-5xl text-charcoal font-semibold leading-tight mb-3">
              {item.name}
            </h1>

            {/* Price */}
            {item.price > 0 && (
              <p className="text-3xl font-bold text-charcoal mb-5">
                ₹{item.price?.toLocaleString('en-IN')}
              </p>
            )}

            {/* Occasion tags */}
            {item.occasions && item.occasions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {item.occasions.map(occ => (
                  <span key={occ} className="px-3 py-1 bg-stone text-slate text-xs font-medium rounded-full capitalize">
                    {occ}
                  </span>
                ))}
              </div>
            )}

            {/* Fabric */}
            {item.fabric && (
              <div className="mb-6">
                <p className="text-[10px] font-semibold text-slate uppercase tracking-widest mb-1">Fabric</p>
                <p className="text-charcoal text-sm">{item.fabric}</p>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-stone mb-6" />

            {/* Colour selector — signature large swatches */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[10px] font-semibold text-slate uppercase tracking-widest">Colour</p>
                {selectedColour && (
                  <span className="text-sm text-charcoal capitalize font-medium">{selectedColour.name}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {item.colours.map(c => {
                  const allVariantsForColour = item.variants.filter(v => v.colour_hex === c.hex);
                  const isSold = allVariantsForColour.length > 0 && allVariantsForColour.every(v => v.status === 'sold');
                  const isSelected = selectedColour?.hex === c.hex;
                  return (
                    <button
                      key={c.hex}
                      onClick={() => { setSelectedColour(c); setSelectedVariant(null); }}
                      title={c.name}
                      className={`colour-swatch w-10 h-10 ${isSelected ? 'colour-swatch-selected' : ''} ${isSold ? 'colour-swatch-sold' : ''}`}
                      style={{ backgroundColor: c.hex }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Size selector */}
            <div className="mb-7">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold text-slate uppercase tracking-widest">Size</p>
                <button
                  onClick={() => setShowSizeGuide(!showSizeGuide)}
                  className="text-xs text-accent font-semibold hover:text-accent-dark transition-colors"
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
                      } ${alreadyInList ? 'ring-2 ring-emerald-400/70' : ''}`}
                    >
                      {size === 'free_size' ? 'Free Size' : size}
                      {alreadyInList && <span className="ml-1 text-emerald-500">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Guide inline */}
            {showSizeGuide && sizeGuideData && (
              <div className="mb-7 p-4 bg-accent-light rounded-2xl border border-accent/15 animate-slide-up">
                <h4 className="font-semibold text-charcoal mb-3 text-sm">
                  Size Guide — {TYPE_LABELS[item.type]}
                </h4>
                <div className="overflow-x-auto -mx-1 px-1">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        {sizeGuideData.headers.map(h => (
                          <th key={h} className="px-3 py-2 text-left text-accent font-semibold border-b border-accent/20 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sizeGuideData.rows.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white/60' : ''}>
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 text-slate border-b border-accent/10 whitespace-nowrap">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Add to Shortlist CTA */}
            <button
              onClick={handleAddToShortlist}
              disabled={!canAdd}
              className={`w-full py-4 rounded-2xl font-semibold text-base transition-all duration-300 ${
                addedFeedback
                  ? 'bg-charcoal text-ivory shadow-lg'
                  : canAdd
                    ? 'bg-accent text-ivory hover:bg-accent-dark shadow-md active:scale-[0.98]'
                    : 'bg-stone text-dust cursor-not-allowed'
              }`}
            >
              {addedFeedback ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved to Shortlist!
                </span>
              ) : canAdd ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Add to Shortlist
                </span>
              ) : (
                'All sizes in shortlist or sold out'
              )}
            </button>

            {/* Item code hint */}
            {item.item_code && (
              <p className="text-xs text-dust text-center mt-3">
                Reference code <span className="font-mono font-semibold text-slate">{item.item_code}</span> — share with staff
              </p>
            )}
          </div>
        </div>

        {/* Similar Items */}
        {similarItems.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="font-display text-3xl text-charcoal font-semibold">You May Also Like</h2>
              <div className="flex-1 h-px bg-stone" />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
              {similarItems.map(si => (
                <div key={si.id} className="w-52 shrink-0 snap-start">
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
