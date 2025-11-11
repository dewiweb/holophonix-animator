import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * Unit test configuration for tests that don't need jsdom
 * (e.g., store tests, utility tests, pure logic tests)
 */
export default defineConfig({
  test: {
    environment: 'node', // Use node environment instead of jsdom
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['src/**/*.integration.test.ts', '**/node_modules/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
    },
  },
})
