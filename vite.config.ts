import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/taskmgr/',
  server: {
    host: true,
    allowedHosts: ['ryantan.site'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Task Manager',
        short_name: 'Tasks',
        description: 'Offline task manager — tasks, projects, time tracking, pomodoro and metrics.',
        theme_color: '#3f51b5',
        background_color: '#303030',
        display: 'standalone',
        start_url: '/taskmgr/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Everything the app needs is bundled; runtime caching of assets is not needed.
        navigateFallback: '/taskmgr/index.html',
      },
    }),
  ],
})