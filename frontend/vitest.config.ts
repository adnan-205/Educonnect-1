import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setupTests.ts'],
    include: [
      'tests/**/*.spec.ts',
      'tests/**/*.spec.tsx',
    ],
    css: false,
  },
  resolve: {
    alias: {
      '@/': new URL('./', import.meta.url).pathname,
      '@': new URL('./', import.meta.url).pathname,
    },
  },
});
