import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// The `#shared` alias is Nuxt's, spelled here too so a plain node test can import a
// utility that reads the shared records.
export default defineConfig({
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
})
