import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // ponytail: PWA solo cachea la app (shell). No hay cola offline de datos:
      // eso lo necesita el POS, no el ERP. Ver docs/libs.md.
      devOptions: { enabled: false },
      manifest: {
        name: 'Cuish ERP',
        short_name: 'Cuish',
        description: 'Inventario y recetas — Cuish Mezcaleria',
        theme_color: '#18181b',
        background_color: '#fafaf9',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
})
