/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Boutique palette ─────────────────────────────────────────
        ivory:   '#F8F4EF',        // page background
        stone:   '#E8E0D5',        // borders, dividers
        charcoal:'#2C2C2C',        // primary text
        slate:   '#6B6560',        // secondary text / labels
        dust:    '#9B8E85',        // disabled / sold-out
        // Burnt sienna accent — drawn from warm Indian fabric tones
        accent: {
          DEFAULT: '#B85C38',
          light:   '#F2E8E3',
          dark:    '#8F3F22',
          mid:     '#D4795A',
        },
        // Legacy brand kept for admin portal (untouched)
        brand: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:    ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in':        'fadeIn 0.4s ease-out forwards',
        'fade-up':        'fadeUp 0.45s ease-out forwards',
        'slide-up':       'slideUp 0.4s ease-out forwards',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.32,0.72,0,1) forwards',
        'slide-out-right':'slideOutRight 0.3s cubic-bezier(0.32,0.72,0,1) forwards',
        'pulse-soft':     'pulseSoft 2s ease-in-out infinite',
        'pulse-ring':     'pulseRing 0.5s ease-out forwards',
        'shimmer':        'shimmer 1.6s linear infinite',
        'scale-in':       'scaleIn 0.2s ease-out forwards',
        'cross-fade':     'crossFade 0.35s ease-out forwards',
        'bounce-in':      'bounceIn 0.4s cubic-bezier(0.36,0.07,0.19,0.97) forwards',
        'float-up':       'floatUp 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideOutRight: {
          '0%':   { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(100%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.65' },
        },
        pulseRing: {
          '0%':   { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(184,92,56,0.6)' },
          '60%':  { transform: 'scale(1.15)', boxShadow: '0 0 0 10px rgba(184,92,56,0)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(184,92,56,0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        crossFade: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '60%':  { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        floatUp: {
          '0%':   { opacity: '0', transform: 'translateY(6px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      boxShadow: {
        'card':    '0 2px 16px 0 rgba(44,44,44,0.08)',
        'card-lg': '0 8px 32px 0 rgba(44,44,44,0.12)',
        'fab':     '0 4px 20px 0 rgba(184,92,56,0.35)',
        'panel':   '-8px 0 40px 0 rgba(44,44,44,0.15)',
      },
    },
  },
  plugins: [],
};
