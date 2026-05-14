/**
 * TAG Game UI Kit - Tailwind preset (ESM)
 * Consume from the per-repo tailwind.config.js:
 *   import tagPreset from './client/src/theme/tailwind-preset.js';
 *   export default { presets: [tagPreset], content: [...] };
 */

/** @type {import('tailwindcss').Config} */
export default {
  // Disable Tailwind's global preflight reset. The plugin runs INSIDE WordPress
  // pages where the theme already supplies its own resets; loading our preflight
  // re-resets buttons, links, margins on theme elements (broke the site header
  // hamburger). Component classes in components.css set their own typography.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        'tag-void': '#0B0F1A',
        'tag-midnight': '#151A2B',
        'tag-steel': '#1E2438',
        'tag-slate': '#2A3148',
        'tag-text': '#F0F2F7',
        'tag-text-secondary': '#8B95A8',
        'tag-text-muted': '#5A6478',
        'tag-cyan': '#22C5D4',
        'tag-purple': '#6C63FF',
        'tag-success': '#22C55E',
        'tag-error': '#EF4444',
        'tag-warning': '#F59E0B',
        'tag-gold': '#FFD700',
        'tag-tier-green': '#22C55E',
        'tag-tier-blue': '#3B82F6',
        'tag-tier-purple': '#A855F7',
        'tag-tier-gold': '#EAB308',
      },
      fontFamily: {
        display: ['"Bungee"', 'cursive'],
        body: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        pixel: ['"Press Start 2P"', 'monospace'],
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'tag-sm': '0.5rem',
        'tag-md': '0.75rem',
        'tag-lg': '1rem',
      },
      boxShadow: {
        'tag-focus': '0 0 0 3px rgba(34, 197, 212, 0.15)',
        'tag-hover': '0 4px 20px rgba(34, 197, 212, 0.15)',
        'tag-card-hover': '0 8px 30px rgba(0, 212, 255, 0.15)',
      },
      backgroundImage: {
        'tag-card': 'linear-gradient(160deg, rgba(21, 26, 43, 0.90) 0%, rgba(11, 15, 26, 0.95) 100%)',
        'tag-border': 'linear-gradient(135deg, #22C5D4, #6C63FF, #22C5D4)',
      },
      keyframes: {
        'tag-border-flow': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%':      { 'background-position': '100% 50%' },
        },
        'tag-flip': {
          '0%':   { transform: 'rotateY(90deg)', opacity: '0' },
          '100%': { transform: 'rotateY(0)', opacity: '1' },
        },
        'tag-shake': {
          '0%, 100%':                       { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%':         { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%':              { transform: 'translateX(4px)' },
        },
        'tag-slide-up': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },
        'tag-glow': {
          '0%, 100%': { filter: 'drop-shadow(0 0 6px rgba(34, 197, 212, 0.30))' },
          '50%':      { filter: 'drop-shadow(0 0 18px rgba(34, 197, 212, 0.60))' },
        },
        'tag-score-pop': {
          '0%':   { transform: 'scale(0.85)', opacity: '0' },
          '60%':  { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'tag-border-flow': 'tag-border-flow 6s ease infinite',
        'tag-flip':        'tag-flip 500ms ease-out forwards',
        'tag-shake':       'tag-shake 400ms ease-in-out',
        'tag-slide-up':    'tag-slide-up 350ms ease-out forwards',
        'tag-glow':        'tag-glow 2s ease-in-out infinite',
        'tag-score-pop':   'tag-score-pop 400ms ease-out forwards',
      },
      maxWidth: {
        'tag-game': '720px',
        'tag-content': '720px',
        'tag-page': '1280px',
      },
    },
  },
};
