import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy all API requests to production backend to bypass CORS
      '/orders': {
        target: 'https://coffeeshop-mobileappproject-backend.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/users': {
        target: 'https://coffeeshop-mobileappproject-backend.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/promotions': {
        target: 'https://coffeeshop-mobileappproject-backend.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/notifications': {
        target: 'https://coffeeshop-mobileappproject-backend.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/combos': {
        target: 'https://coffeeshop-mobileappproject-backend.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/fcm': {
        target: 'https://coffeeshop-mobileappproject-backend.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/testconnection': {
        target: 'https://coffeeshop-mobileappproject-backend.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    }
  }
})