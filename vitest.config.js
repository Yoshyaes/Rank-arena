import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['legacy/server/**/*.test.js'],
    environment: 'node',
  },
});
