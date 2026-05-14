import tagPreset from './src/theme/tailwind-preset.js';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [tagPreset],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // Scope utilities to the plugin's root div - prevents the same theme-nav
  // bleed-through that affected Connections (unlayered .hidden beating the
  // theme's @layer utilities .md\:flex). Safe across both plugins.
  important: '#rank-arena-root',
  theme: {
    extend: {
      // Legacy aliases - kept so existing components still compile while we
      // migrate them onto tag-* tokens. CSS vars they reference now resolve
      // to the new TAG palette via index.css.
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-card': 'var(--bg-card)',
        'bg-card-hover': 'var(--bg-card-hover)',
        'bg-surface': 'var(--bg-surface)',
        'accent-win': 'var(--accent-win)',
        'accent-lose': 'var(--accent-lose)',
        'accent-gold': 'var(--accent-gold)',
        'accent-blue': 'var(--accent-blue)',
        'accent-purple': 'var(--accent-purple)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'border': 'var(--border)',
      },
      fontFamily: {
        grotesk: ['"Space Grotesk"', 'sans-serif'],
      },
    },
  },
};
