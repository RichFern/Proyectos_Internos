import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'logo-mark.svg',
        'logo-horizontal.svg',
      ],
      manifest: {
        name: 'A la PaR — gastos compartidos',
        short_name: 'A la PaR',
        description:
          'Gastos del hogar y paseos en proporción a lo que gana cada uno.',
        theme_color: '#008080',
        background_color: '#f4f8f8',
        display: 'standalone',
        orientation: 'portrait-primary',
        lang: 'es',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
