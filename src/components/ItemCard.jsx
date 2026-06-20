import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as DS from '../services/DataService';

const TYPE_LABELS = {
  top: 'Top', bottom: 'Bottom', shorts: 'Shorts', long_dress: 'Long Dress',
  coord_set: 'Coord Set', kurti: 'Kurti', other: 'Others',
};

export default function ItemCard({ item, priority = false }) {
  const [selectedColourIdx, setSelectedColourIdx] = useState(0);
  const colours = item.colours || [];
  const currentColour = colours[selectedColourIdx] || {};
  const imageUrl = currentColour.image_url || `https://placehold.co/400x500/EEF2FF/4F46E5?text=${encodeURIComponent(item.name)}`;

  // Check if all variants for current colour are sold
  const currentColourVariants = (item.variants || []).filter(
    v => v.colour_hex === currentColour.hex
  );
  const isCurrentColourSold = currentColourVariants.length > 0 && currentColourVariants.every(v => v.status === 'sold');

  return (
    <Link
      to={`/item/${item.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <img
          src={DS.getOptimizedImageUrl(imageUrl, 400, 60)}
          alt={item.name}
          loading={priority ? 'eager' : 'lazy'}
          fetchpriority={priority ? 'high' : 'auto'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = `https://placehold.co/400x500/EEF2FF/4F46E5?text=${encodeURIComponent(item.name)}`;
          }}
        />

        {/* NEW badge */}
        {item.isNew && !item.allSold && (
          <span className="badge-new">NEW</span>
        )}

        {/* SOLD overlay */}
        {item.allSold && (
          <div className="badge-sold" />
        )}

        {/* Price tag — hidden if no price set */}
        {item.price > 0 && (
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg">
            <span className="text-lg font-bold text-gray-900">₹{item.price?.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Type tag */}
        <span className="inline-block px-2.5 py-0.5 bg-brand-50 text-brand-700 text-xs font-semibold rounded-full mb-2">
          {TYPE_LABELS[item.type] || item.type}
        </span>

        {/* Name */}
        <h3 className="font-semibold text-gray-900 text-base leading-tight mb-3 group-hover:text-brand-700 transition-colors">
          {item.name}
        </h3>

        {/* Colour chips */}
        {colours.length > 1 && (
          <div className="flex items-center gap-1.5 mb-2" onClick={(e) => e.preventDefault()}>
            {colours.map((c, idx) => {
              const allVariantsForColour = (item.variants || []).filter(v => v.colour_hex === c.hex);
              const isSold = allVariantsForColour.length > 0 && allVariantsForColour.every(v => v.status === 'sold');
              return (
                <button
                  key={c.hex}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedColourIdx(idx); }}
                  title={c.name}
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                    idx === selectedColourIdx
                      ? 'ring-2 ring-brand-500 ring-offset-1 border-white'
                      : 'border-gray-200'
                  } ${isSold ? 'opacity-30' : ''}`}
                  style={{ backgroundColor: c.hex }}
                />
              );
            })}
          </div>
        )}

        {/* Size pills */}
        {item.sizes && item.sizes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.sizes.map(size => {
              const sizeVariants = (item.variants || []).filter(v => v.size === size);
              const isSold = sizeVariants.length > 0 && sizeVariants.every(v => v.status === 'sold');
              return (
                <span
                  key={size}
                  className={`px-2 py-0.5 text-xs font-medium rounded ${
                    isSold
                      ? 'bg-gray-50 text-gray-300 line-through'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {size === 'free_size' ? 'Free' : size}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </Link>
  );
}
