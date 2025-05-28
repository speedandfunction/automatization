import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

dotenv.config({ path: '.env.test' });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      all: true,
      // include: ['src/**/*.ts'],
      exclude: ['src/dist/**', 'eslint.config.js', 'vitest.config.ts'],
    },
  },
});
