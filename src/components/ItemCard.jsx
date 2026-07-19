import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as DS from '../services/DataService';

const TYPE_LABELS = {
  top: 'Top', bottom: 'Bottom', shorts: 'Shorts', long_dress: 'Long Dress', one_piece: 'One Piece',
  coord_set: 'Coord Set', kurti: 'Kurti', other: 'Others',
};

// Signature swatch strip — pill-shaped with selected colour name label
function SwatchStrip({ colours, variants, selectedIdx, onSelect }) {
  if (!colours || colours.length === 0) return null;
  const selected = colours[selectedIdx];

  return (
    <div
      className="flex items-center gap-1.5"
      onClick={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-1">
        {colours.slice(0, 5).map((c, idx) => {
          const allVariantsForColour = (variants || []).filter(v => v.colour_hex === c.hex);
          const isSold = allVariantsForColour.length > 0 && allVariantsForColour.every(v => v.status === 'sold');
          const isSelected = idx === selectedIdx;
          return (
            <button
              key={c.hex}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(idx); }}
              title={c.name}
              className={`transition-all duration-200 rounded-full border-2 flex-shrink-0 ${
                isSelected
                  ? 'w-5 h-5 border-accent ring-1 ring-accent ring-offset-1 scale-110'
                  : 'w-4 h-4 border-stone/60 hover:border-dust hover:scale-110'
              } ${isSold ? 'opacity-30' : ''}`}
              style={{ backgroundColor: c.hex }}
            />
          );
        })}
        {colours.length > 5 && (
          <span className="text-[10px] text-dust font-medium ml-0.5">+{colours.length - 5}</span>
        )}
      </div>
      {/* Selected colour name — the signature detail */}
      {selected && colours.length > 1 && (
        <span className="text-[10px] text-slate capitalize font-medium leading-none truncate max-w-[80px]">
          {selected.name}
        </span>
      )}
    </div>
  );
}

// Image with skeleton loader
function ProductImage({ src, alt, priority }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  // Immediately mark as loaded if cached
  React.useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalHeight !== 0) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <div className="relative w-full h-full">
      {/* Skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 skeleton" />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : 'auto'}
        decoding="async"
        width={400}
        height={533}
        className={`w-full h-full object-cover transition-opacity duration-400 group-hover:scale-105 transition-transform duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => { setError(true); setLoaded(true); }}
      />
    </div>
  );
}

export default function ItemCard({ item, priority = false }) {
  const [selectedColourIdx, setSelectedColourIdx] = useState(0);
  const colours = item.colours || [];
  const currentColour = colours[selectedColourIdx] || {};
  const imageUrl = DS.getOptimizedImageUrl(
    currentColour.image_url || `https://placehold.co/400x533/E8E0D5/9B8E85?text=${encodeURIComponent(item.name)}`,
    400,
    'auto'
  );
  const fallbackUrl = `https://placehold.co/400x533/E8E0D5/9B8E85?text=${encodeURIComponent(item.name)}`;

  return (
    <Link
      to={`/item/${item.id}`}
      className="lookbook-card group block no-select"
    >
      {/* Image — 3:4 aspect ratio */}
      <div className="relative aspect-[3/4] overflow-hidden bg-stone/40">
        <ProductImage
          src={imageUrl}
          alt={item.name}
          priority={priority}
        />

        {/* NEW badge */}
        {item.isNew && !item.allSold && (
          <span className="badge-new">New</span>
        )}

        {/* SOLD overlay */}
        {item.allSold && (
          <div className="badge-sold" />
        )}

        {/* Price — bottom right glass pill */}
        {item.price > 0 && (
          <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1 shadow-sm">
            <span className="text-sm font-bold text-charcoal">₹{item.price?.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="px-3.5 pt-3 pb-3.5">
        {/* Type tag */}
        <span className="text-[10px] font-semibold text-accent uppercase tracking-widest">
          {TYPE_LABELS[item.type] || item.type}
        </span>

        {/* Name */}
        <h3 className="font-display text-[17px] text-charcoal font-medium leading-snug mt-0.5 mb-2.5 line-clamp-2 group-hover:text-accent transition-colors duration-200">
          {item.name}
        </h3>

        {/* Signature swatch strip */}
        <SwatchStrip
          colours={colours}
          variants={item.variants}
          selectedIdx={selectedColourIdx}
          onSelect={setSelectedColourIdx}
        />

        {/* Size availability row */}
        {item.sizes && item.sizes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {item.sizes.slice(0, 5).map(size => {
              const sizeVariants = (item.variants || []).filter(v => v.size === size);
              const isSold = sizeVariants.length > 0 && sizeVariants.every(v => v.status === 'sold');
              return (
                <span
                  key={size}
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${
                    isSold
                      ? 'text-dust line-through'
                      : 'text-slate'
                  }`}
                >
                  {size === 'free_size' ? 'Free' : size}
                </span>
              );
            })}
            {item.sizes.length > 5 && (
              <span className="text-[10px] text-dust">+{item.sizes.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
