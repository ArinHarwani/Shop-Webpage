import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import * as DS from '../services/DataService';

const TYPE_LABELS = {
  top: 'Top', bottom: 'Bottom', shorts: 'Shorts', long_dress: 'Long Dress', one_piece: 'One Piece',
  coord_set: 'Coord Set', kurti: 'Kurti', other: 'Others',
};

// Preload an image URL into the browser cache
function preloadImage(url) {
  if (!url) return;
  const img = new Image();
  img.src = url;
}

export default function SwipeMode({ items }) {
  const { addToShortlist, isInShortlist } = useSession();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [slideDirection, setSlideDirection] = useState('');
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const minSwipeDistance = 50;

  useEffect(() => {
    setCurrentIndex(0);
    setSlideDirection('');
  }, [items]);

  // Preload next image whenever index changes
  useEffect(() => {
    const next = items[currentIndex + 1];
    if (next) {
      const nextColour = (next.colours || [])[0] || {};
      const nextUrl = DS.getOptimizedImageUrl(nextColour.image_url, 800, 'auto');
      preloadImage(nextUrl);
    }
  }, [currentIndex, items]);

  const handleNext = () => {
    if (currentIndex < items.length) {
      setSlideDirection('slide-left');
      setImgLoaded(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSlideDirection('');
      }, 220);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSlideDirection('slide-right');
      setImgLoaded(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setSlideDirection('');
      }, 220);
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
    if (distance > minSwipeDistance) handleNext();
    else if (distance < -minSwipeDistance) handlePrev();
  };

  if (items.length === 0) return null;

  // End of items card
  if (currentIndex >= items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 animate-fade-up">
        <div className="w-20 h-20 bg-stone rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-dust" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <h3 className="font-display text-3xl text-charcoal font-semibold mb-2">You've seen it all ✦</h3>
        <p className="text-slate text-base max-w-xs mb-8">
          You've browsed through the entire collection. Ask our staff to see more.
        </p>
        <button
          onClick={() => { setCurrentIndex(0); setSlideDirection(''); }}
          className="px-6 py-3 bg-white border border-stone text-charcoal font-semibold rounded-xl hover:border-accent hover:text-accent transition-all duration-200 shadow-card"
        >
          Browse Again
        </button>
      </div>
    );
  }

  const item = items[currentIndex];
  const colours = item.colours || [];
  const currentColour = colours[0] || {};
  const imageUrl = DS.getOptimizedImageUrl(
    currentColour.image_url || `https://placehold.co/800x1000/E8E0D5/9B8E85?text=${encodeURIComponent(item.name)}`,
    800,
    'auto'
  );

  const canAdd = item.variants.some(v => v.status === 'available' && !isInShortlist(v.id));

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canAdd) return;
    const firstAvailable = item.variants.find(v => v.status === 'available' && !isInShortlist(v.id));
    if (firstAvailable) {
      const result = await addToShortlist(item.id, firstAvailable.id);
      if (result) {
        setAddedFeedback(true);
        setTimeout(() => setAddedFeedback(false), 2000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto pb-4">
      {/* Progress + counter */}
      <div className="w-full flex items-center gap-3 mb-4 px-1">
        <div className="flex-1 h-1 bg-stone rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate font-medium shrink-0">
          {currentIndex + 1} / {items.length}
        </span>
      </div>

      {/* Main Card */}
      <div
        className={`w-full transition-all duration-220 ease-out ${
          slideDirection === 'slide-left'  ? '-translate-x-6 opacity-0' :
          slideDirection === 'slide-right' ? 'translate-x-6 opacity-0' :
          'translate-x-0 opacity-100'
        }`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndHandler}
      >
        <Link
          to={`/item/${item.id}`}
          className="block bg-white rounded-3xl overflow-hidden shadow-card-lg border border-stone/60 no-select"
        >
          {/* Image */}
          <div className="relative aspect-[3/4] bg-stone/40">
            {/* Skeleton while loading */}
            {!imgLoaded && <div className="absolute inset-0 skeleton" />}
            <img
              src={imageUrl}
              alt={item.name}
              loading="eager"
              fetchpriority="high"
              decoding="async"
              width={800}
              height={1000}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
              onError={(e) => {
                e.target.src = `https://placehold.co/800x1000/E8E0D5/9B8E85?text=${encodeURIComponent(item.name)}`;
                setImgLoaded(true);
              }}
              draggable={false}
            />

            {/* NEW badge */}
            {item.isNew && !item.allSold && (
              <span className="badge-new">New</span>
            )}

            {/* Price */}
            {item.price > 0 && (
              <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
                <span className="text-base font-bold text-charcoal">₹{item.price?.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Swipe hint — shows only on first card */}
            {currentIndex === 0 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-charcoal/70 backdrop-blur-sm text-ivory text-xs px-3 py-1.5 rounded-full">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4" />
                </svg>
                Swipe to browse
              </div>
            )}
          </div>

          {/* Details */}
          <div className="px-5 py-4">
            <span className="text-[10px] font-semibold text-accent uppercase tracking-widest">
              {TYPE_LABELS[item.type] || item.type}
            </span>
            <h3 className="font-display text-2xl text-charcoal font-semibold mt-0.5 mb-3 leading-tight">
              {item.name}
            </h3>

            {/* Colour swatches */}
            {colours.length > 0 && (
              <div className="flex items-center gap-1.5 mb-3">
                {colours.slice(0, 6).map(c => (
                  <div
                    key={c.hex}
                    title={c.name}
                    className="w-4 h-4 rounded-full border border-stone/60 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                {colours.length > 6 && <span className="text-[10px] text-dust">+{colours.length - 6}</span>}
              </div>
            )}

            {/* Sizes */}
            {item.sizes && item.sizes.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {item.sizes.slice(0, 5).map(size => {
                  const sizeVariants = (item.variants || []).filter(v => v.size === size);
                  const isSold = sizeVariants.length > 0 && sizeVariants.every(v => v.status === 'sold');
                  return (
                    <span
                      key={size}
                      className={`px-2 py-0.5 text-xs font-medium rounded-lg border ${
                        isSold
                          ? 'border-stone/40 text-dust line-through'
                          : 'border-stone text-slate'
                      }`}
                    >
                      {size === 'free_size' ? 'Free' : size}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Actions row */}
            <div className="flex items-center gap-3">
              {/* Quick add to shortlist */}
              <button
                onClick={handleQuickAdd}
                disabled={!canAdd}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  addedFeedback
                    ? 'bg-charcoal text-ivory'
                    : canAdd
                      ? 'bg-accent text-ivory hover:bg-accent-dark active:scale-[0.97]'
                      : 'bg-stone text-dust cursor-not-allowed'
                }`}
              >
                {addedFeedback ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Added!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill={canAdd ? 'none' : 'currentColor'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={canAdd ? 1.8 : 0}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {canAdd ? 'Save' : 'In Shortlist'}
                  </>
                )}
              </button>

              {/* View details */}
              <Link
                to={`/item/${item.id}`}
                onClick={(e) => e.stopPropagation()}
                className="w-11 h-11 flex items-center justify-center rounded-xl border border-stone text-slate hover:border-accent hover:text-accent hover:bg-accent-light transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-4 w-full">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="w-12 h-12 rounded-full bg-white shadow-card border border-stone flex items-center justify-center text-slate hover:text-accent hover:border-accent hover:bg-accent-light disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={handleNext}
          className="w-12 h-12 rounded-full bg-white shadow-card border border-stone flex items-center justify-center text-slate hover:text-accent hover:border-accent hover:bg-accent-light transition-all active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
