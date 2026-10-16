import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_BASE_URL': JSON.stringify(env.BASE_URL || env.VITE_BASE_URL || ''),
    },
    server: {
      port: 5173,
      // proxy: {
      //   '^/(auth|customers|projects|policies|api-keys|v1|test|health|actuator)(/|$)': {
      //     target,
      //     changeOrigin: true,
      //   },
      // },
    },
  }
})


