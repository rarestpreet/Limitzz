import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:8081',
      '/customers': 'http://localhost:8081',
      '/projects': 'http://localhost:8081',
      '/policies': 'http://localhost:8081',
      '/api-keys': 'http://localhost:8081',
      '/v1': 'http://localhost:8081',
      '/test': 'http://localhost:8081',
      '/health': 'http://localhost:8081',
      '/actuator': 'http://localhost:8081',
    },
  },
})

