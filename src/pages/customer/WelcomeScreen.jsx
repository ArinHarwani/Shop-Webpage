import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import * as DS from '../../services/DataService';

const CATEGORIES = [
  { key: 'top',               label: 'Tops',                          emoji: '👕' },
  { key: 'one_piece_dresses', label: 'One Piece & Dresses',           emoji: '👗' },
  { key: 'coord_ethnic',      label: 'Coord Sets & Ethnic Fashion',   emoji: '✨' },
  { key: 'bottom',            label: 'Bottoms',                       emoji: '👖' },
  { key: 'other',             label: 'Others',                        emoji: '🛍️' },
];

export default function WelcomeScreen() {
  const [name, setName] = useState('');
  const [phase, setPhase] = useState('name'); // 'name' | 'category'
  const [isExiting, setIsExiting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();
  const { startSession } = useSession();
  const settings = DS.getSettings();

  const handleNameContinue = () => {
    setPhase('category');
  };

  const handleCategorySelect = (categoryKey) => {
    if (categoryKey === 'one_piece_dresses') {
      setPhase('dress_subselect');
      return;
    }
    proceedToCatalog(categoryKey);
  };

  const proceedToCatalog = async (categoryKey) => {
    setSelectedCategory(categoryKey);
    setIsExiting(true);
    await startSession(name.trim());
    setTimeout(() => navigate(`/catalog?type=${categoryKey}`), 350);
  };

  return (
    <div
      className={`min-h-screen bg-ivory flex flex-col items-center justify-center transition-opacity duration-350 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Decorative background texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-stone/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-light/60 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>

      {phase === 'name' ? (
        /* ── Phase 1: Name + Brand ─────────────────────────── */
        <div className="relative z-10 text-center px-6 w-full max-w-sm animate-fade-up">
          {/* Shop Identity */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-charcoal rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-card">
              <svg className="w-8 h-8 text-ivory" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h1 className="font-display text-5xl text-charcoal font-semibold tracking-tight mb-2">
              {settings.shopName || 'DressMirror'}
            </h1>
            <p className="text-slate text-base font-light">Your personal style catalog</p>
          </div>

          {/* Separator */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px bg-stone" />
            <span className="text-dust text-xs uppercase tracking-widest">Browse Collection</span>
            <div className="flex-1 h-px bg-stone" />
          </div>

          {/* Name input */}
          <div className="mb-6" onClick={(e) => e.stopPropagation()}>
            <label className="block text-left text-xs font-semibold text-slate uppercase tracking-wider mb-2">
              Your name <span className="text-dust font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya"
              className="w-full px-5 py-4 bg-white border border-stone rounded-2xl text-charcoal placeholder:text-dust text-base focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all duration-200"
              onKeyDown={(e) => { if (e.key === 'Enter') handleNameContinue(); }}
              autoComplete="off"
            />
          </div>

          {/* CTA */}
          <button
            onClick={handleNameContinue}
            className="w-full py-4 bg-charcoal text-ivory font-semibold text-base rounded-2xl shadow-card hover:bg-charcoal/90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            Start Browsing
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <p className="text-dust text-xs mt-4">Tap to begin · Session expires in 2 hours</p>
        </div>

      ) : phase === 'dress_subselect' ? (
        /* ── Phase 2b: One Piece vs Long Dress Sub-selector ───── */
        <div className="relative z-10 w-full max-w-xl px-4 animate-fade-up">
          <div className="text-center mb-6 px-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-light/80 text-accent rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              👗 Dresses & One Piece
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-charcoal font-semibold">
              Select Your Style
            </h2>
            <p className="text-slate text-sm mt-1">
              Choose a specific dress style or view everything
            </p>
          </div>

          {/* Subcategory Choices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {/* One Piece */}
            <button
              onClick={() => proceedToCatalog('one_piece')}
              className={`group relative bg-white border border-stone rounded-2xl p-5 text-left shadow-card
                hover:border-accent hover:shadow-card-lg hover:-translate-y-0.5
                active:scale-[0.97] transition-all duration-250 animate-fade-up
                ${selectedCategory === 'one_piece' ? 'border-accent bg-accent-light scale-[0.97]' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">👗</span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-stone/40 text-slate rounded-full group-hover:bg-accent group-hover:text-ivory transition-colors">
                  Select →
                </span>
              </div>
              <h3 className="font-semibold text-charcoal text-lg leading-tight mb-1">One Piece</h3>
              <p className="text-slate text-xs leading-relaxed">
                Chic midi, short, and casual one-piece dresses
              </p>
            </button>

            {/* Long Dress */}
            <button
              onClick={() => proceedToCatalog('long_dress')}
              style={{ animationDelay: '60ms' }}
              className={`group relative bg-white border border-stone rounded-2xl p-5 text-left shadow-card
                hover:border-accent hover:shadow-card-lg hover:-translate-y-0.5
                active:scale-[0.97] transition-all duration-250 animate-fade-up
                ${selectedCategory === 'long_dress' ? 'border-accent bg-accent-light scale-[0.97]' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">✨</span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-stone/40 text-slate rounded-full group-hover:bg-accent group-hover:text-ivory transition-colors">
                  Select →
                </span>
              </div>
              <h3 className="font-semibold text-charcoal text-lg leading-tight mb-1">Long Dress</h3>
              <p className="text-slate text-xs leading-relaxed">
                Full-length maxis, party gowns, and festive dresses
              </p>
            </button>
          </div>

          {/* Option: View Both */}
          <button
            onClick={() => proceedToCatalog('one_piece_dresses')}
            style={{ animationDelay: '120ms' }}
            className={`w-full group relative bg-white border border-stone rounded-2xl p-4 text-left shadow-card
              hover:border-accent hover:shadow-card-lg hover:-translate-y-0.5
              active:scale-[0.97] transition-all duration-250 animate-fade-up flex items-center justify-between
              ${selectedCategory === 'one_piece_dresses' ? 'border-accent bg-accent-light scale-[0.97]' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛍️</span>
              <div>
                <p className="font-semibold text-charcoal text-sm leading-tight">View All Dresses & One Piece</p>
                <p className="text-dust text-xs">Browse the complete collection together</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-accent px-3 py-1.5 rounded-xl bg-accent-light">
              View All
            </span>
          </button>

          {/* Back button */}
          <div className="text-center mt-5">
            <button
              onClick={() => setPhase('category')}
              className="text-dust text-sm hover:text-slate transition-colors inline-flex items-center gap-1"
            >
              ← Back to categories
            </button>
          </div>
        </div>

      ) : (
        /* ── Phase 2: Category Picker ──────────────────────── */
        <div className="relative z-10 w-full max-w-2xl px-4 animate-fade-up">
          {/* Greeting */}
          <div className="text-center mb-6 px-2">
            <p className="text-slate text-sm mb-1">
              {name ? `Welcome, ${name}` : 'Welcome'}
            </p>
            <h2 className="font-display text-4xl sm:text-5xl text-charcoal font-semibold">
              What are you looking for?
            </h2>
          </div>

          {/* Category grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.key}
                onClick={() => handleCategorySelect(cat.key)}
                style={{ animationDelay: `${i * 60}ms` }}
                className={`group relative bg-white border border-stone rounded-2xl p-5 text-left shadow-card
                  hover:border-accent hover:shadow-card-lg hover:-translate-y-0.5
                  active:scale-[0.97]
                  transition-all duration-250 animate-fade-up
                  ${i === 4 ? 'col-span-2 sm:col-span-1' : ''}
                  ${selectedCategory === cat.key ? 'border-accent bg-accent-light scale-[0.97]' : ''}
                `}
              >
                <span className="text-3xl mb-3 block">{cat.emoji}</span>
                <p className="font-semibold text-charcoal text-base leading-tight">{cat.label}</p>
                {/* Accent corner dot */}
                <div className={`absolute top-3 right-3 w-2 h-2 rounded-full bg-accent transition-all duration-200 ${
                  selectedCategory === cat.key ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                }`} />
              </button>
            ))}
          </div>

          {/* Back */}
          <div className="text-center mt-5">
            <button
              onClick={() => setPhase('name')}
              className="text-dust text-sm hover:text-slate transition-colors"
            >
              ← Go back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
