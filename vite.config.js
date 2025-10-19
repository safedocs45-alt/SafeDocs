import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev proxy: forwards /api/* to FastAPI on :8000
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
