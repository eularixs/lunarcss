import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // Match the package self-reference used by src/runtime/tw.ts and tw.web.ts.
      // Vitest's Vite resolver does not honor package.json `exports`, so we
      // wire the bare specifier directly to the source default-empty theme.
      '@lunar-kit/css/__theme__': fileURLToPath(new URL('./src/__theme__.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/__tests__/**', 'src/__theme__.ts'],
    },
  },
})
