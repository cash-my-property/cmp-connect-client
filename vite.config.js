import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_'])
  const apiUrl = env.NEXT_PUBLIC_API_URL || env.VITE_API_URL || 'https://testapi.cmpdubai.com/api'
  const targetHost = apiUrl.replace(/\/api\/?$/, '')

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    server: {
      proxy: {
        '/api': {
          target: targetHost,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
