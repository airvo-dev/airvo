import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('react') || id.includes('scheduler')) {
            return 'vendor-react'
          }
          if (id.includes('highlight.js')) {
            return 'vendor-highlight'
          }
          if (id.includes('marked')) {
            return 'vendor-markdown'
          }
          return 'vendor-misc'
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8765',
        changeOrigin: true,
      },
      '/v1': {
        target: 'http://127.0.0.1:8765',
        changeOrigin: true,
      },
    },
  },
})
