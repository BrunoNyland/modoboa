import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// Standalone Vitest config: the main vite.config.js loads heavy plugins
// (module federation, vuetify, basic-ssl) that unit tests don't need, so
// we only wire up the `@` alias here.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.js'],
  },
})
