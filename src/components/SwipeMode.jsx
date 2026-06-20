import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as DS from '../services/DataService';

const TYPE_LABELS = {
  top: 'Top', bottom: 'Bottom', shorts: 'Shorts', long_dress: 'Long Dress',
  coord_set: 'Coord Set', kurti: 'Kurti', other: 'Others',
};

export default function SwipeMode({ items }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [slideDirection, setSlideDirection] = useState('');

  // Minimum swipe distance
  const minSwipeDistance = 50;

  useEffect(() => {
    setCurrentIndex(0);
    setSlideDirection('');
  }, [items]);

  const handleNext = () => {
    if (currentIndex < items.length) {
      setSlideDirection('slide-left');
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSlideDirection('');
      }, 200); // Wait for transition
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSlideDirection('slide-right');
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setSlideDirection('');
      }, 200);
    }
  };

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  if (items.length === 0) return null;

  if (currentIndex >= items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 lg:py-32 animate-fade-in text-center px-4">
        <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">You've seen everything!</h3>
        <p className="text-gray-500 max-w-md text-lg">Contact the staff to see more of our collection.</p>
        <button 
          onClick={() => { setSlideDirection('slide-right'); setTimeout(() => { setCurrentIndex(0); setSlideDirection(''); }, 200); }}
          className="mt-8 px-6 py-3 bg-brand-50 text-brand-700 font-semibold rounded-xl hover:bg-brand-100 transition-colors"
        >
          View Again
        </button>
      </div>
    );
  }

  const item = items[currentIndex];
  const colours = item.colours || [];
  const currentColour = colours[0] || {};
  const imageUrl = currentColour.image_url || `https://placehold.co/800x1000/EEF2FF/4F46E5?text=${encodeURIComponent(item.name)}`;

  return (
    <div className="flex flex-col items-center justify-center py-4 w-full max-w-md mx-auto">
      {/* Swipe instructions */}
      <div className="w-full flex items-center justify-between px-4 mb-4 text-sm font-medium text-gray-400">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </div>
        <div>
          {currentIndex + 1} of {items.length}
        </div>
        <div className="flex items-center gap-1">
          Next
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Main Card */}
      <div 
        className={`w-full relative touch-pan-y transition-transform duration-200 ease-out ${
          slideDirection === 'slide-left' ? '-translate-x-full opacity-0' :
          slideDirection === 'slide-right' ? 'translate-x-full opacity-0' :
          'translate-x-0 opacity-100'
        }`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndHandler}
      >
        <Link
          to={`/item/${item.id}`}
          className="block bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100"
        >
          {/* Image */}
          <div className="relative aspect-[4/5] bg-gray-100">
            <img
              src={DS.getOptimizedImageUrl(imageUrl, 800, 75)}
              alt={item.name}
              loading="eager"
              fetchpriority="high"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = `https://placehold.co/800x1000/EEF2FF/4F46E5?text=${encodeURIComponent(item.name)}`;
              }}
              draggable={false}
            />
            {/* NEW badge */}
            {item.isNew && !item.allSold && (
              <span className="badge-new scale-110 origin-top-left">NEW</span>
            )}
            
            {/* Price tag */}
            {item.price > 0 && (
              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md rounded-xl px-4 py-2 shadow-xl">
                <span className="text-xl font-bold text-gray-900">₹{item.price?.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6">
            <span className="inline-block px-3 py-1 bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider rounded-full mb-3">
              {TYPE_LABELS[item.type] || item.type}
            </span>
            <h3 className="font-bold text-gray-900 text-xl mb-3">
              {item.name}
            </h3>

            {/* Quick Sizes */}
            {item.sizes && item.sizes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {item.sizes.slice(0, 4).map(size => {
                  const sizeVariants = (item.variants || []).filter(v => v.size === size);
                  const isSold = sizeVariants.length > 0 && sizeVariants.every(v => v.status === 'sold');
                  return (
                    <span
                      key={size}
                      className={`px-2 py-1 text-xs font-semibold rounded-lg border ${
                        isSold
                          ? 'border-gray-100 bg-gray-50 text-gray-400 line-through'
                          : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      {size === 'free_size' ? 'Free' : size}
                    </span>
                  );
                })}
                {item.sizes.length > 4 && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-lg text-gray-500 bg-gray-50">
                    +{item.sizes.length - 4} more
                  </span>
                )}
              </div>
            )}
            
            <p className="text-brand-600 text-sm font-semibold mt-2 text-center w-full bg-brand-50 py-3 rounded-xl">
              Tap to view details & shortlist
            </p>
          </div>
        </Link>
      </div>

      {/* Manual Navigation Buttons */}
      <div className="flex items-center justify-center gap-6 mt-6 w-full px-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="w-16 h-16 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-brand-600 hover:border-brand-200 hover:bg-brand-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={handleNext}
          className="w-16 h-16 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-brand-600 hover:border-brand-200 hover:bg-brand-50 transition-all active:scale-95"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
