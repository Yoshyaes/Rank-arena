import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // No base path: assets resolve from wherever the WordPress shortcode loads them.
  // The shortcode injects absolute URLs anyway, so leaving base at '/' is correct.
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    // Dev: proxy WordPress REST so client can talk to a local WP install.
    // Override host via WP_DEV_URL env when needed.
    proxy: {
      '/wp-json': {
        target: process.env.WP_DEV_URL || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    globals: true,
    setupFiles: ['./src/test-setup.js'],
  },
});
