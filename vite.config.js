import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5054',
        changeOrigin: true,
        secure: false,
      },
      // Ruta específica para la negociación HTTP de SignalR
      '/hotelhub/negotiate': {
        target: 'http://localhost:5054',
        changeOrigin: true,
        secure: false
      },
      // Ruta para el tráfico WebSocket
      '/hotelhub': {
        target: 'ws://localhost:5054',
        ws: true,
        changeOrigin: true,
        secure: false
      }
    }
  }
})