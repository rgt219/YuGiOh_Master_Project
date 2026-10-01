import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';

export default defineConfig({
  test: {
    globals: true,            // your tests use describe / it / expect without importing them
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }, // makes '@/lib/...' work like it does in Next
  },
});