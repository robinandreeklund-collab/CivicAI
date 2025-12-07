import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // ONESEEK Streaming API (SSE token streaming)
      '/stream': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // ONESEEK Δ+ ML Service API (Intent Engine, Typo Checker, etc.)
      '/api/ml': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // ONESEEK Δ+ Config API (token delay, etc.)
      '/api/config': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // ONESEEK Δ+ Settings API (typo check toggle, etc.)
      '/api/settings': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // ONESEEK Δ+ Personality API (PR#101: Unified state, override, active/set)
      '/api/personality': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // ONESEEK Δ+ System Prompts API (character cards, prompts management)
      '/api/system-prompts': {
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
