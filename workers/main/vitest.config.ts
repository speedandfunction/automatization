import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      all: true,
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__/**', 'src/dist/**'],
      // thresholds: {
      //   statements: 70,
      //   branches: 70,
      //   functions: 70,
      //   lines: 70,
      // },
    },
  },
});
