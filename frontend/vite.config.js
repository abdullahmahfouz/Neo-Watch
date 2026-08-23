import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Proxies /api and /ingest to the Spring Boot backend during dev so the browser
// never has to deal with cross-origin requests directly.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
      '/ingest': 'http://localhost:8080',
    },
  },
})
