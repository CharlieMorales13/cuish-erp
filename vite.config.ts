import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      // ponytail: la PWA solo cachea el shell de la app. No hay cola offline de datos:
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
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/shared/test/setup.ts'],
    // jsdom con instrumentación de cobertura es ~3x más lento: las pantallas que pintan
    // ~100 filas y disparan mutaciones necesitan margen.
    testTimeout: 20_000,
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/shared/api/seed/**',
        'src/shared/test/**',
        'src/main.tsx',
      ],
      // Puestos apenas por debajo de lo actual: si algo baja, el pipeline lo caza.
      thresholds: { statements: 88, branches: 88, functions: 75, lines: 88 },
    },
  },
})
