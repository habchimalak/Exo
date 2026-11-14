import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // En dev  → proxy vers localhost:3000
  // En prod → VITE_API_URL pointe vers l'URL Railway (ex: https://exocraft-backend.up.railway.app)
  const backendUrl = env.VITE_API_URL || 'http://localhost:3000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
    // En production Vercel, les appels /api sont redirigés par vercel.json
    // vers le backend Railway via la variable VITE_API_URL
    define: {
      // Rend l'URL du backend accessible dans le code si besoin
      __API_URL__: JSON.stringify(backendUrl),
    },
  }
})
