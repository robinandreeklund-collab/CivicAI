import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // ONESEEK Δ+ ML Service API (Intent Engine, Typo Checker, etc.)
      '/api/ml': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Default API proxy (backend services)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
