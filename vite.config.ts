import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { manifest } from './pwa.manifest'

const APP_VERSION: string = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version
const BUILD_ID = (() => {
  const fromCi = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA
  if (fromCi) return fromCi.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return Date.now().toString(36)
  }
})()
const BUILD_TIME = new Date().toISOString()

/** Publishes /version.json so installed copies (incl. the Android app) can check for updates. */
function versionFile(): Plugin {
  return {
    name: 'version-file',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: APP_VERSION, build: BUILD_ID, time: BUILD_TIME }, null, 2) })
    },
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __BUILD_ID__: JSON.stringify(BUILD_ID),
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          motion: ['motion'],
          gsap: ['gsap', '@gsap/react'],
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    versionFile(),
    VitePWA({
      // 'prompt': a new version waits until the user taps “Update now”.
      registerType: 'prompt',
      injectRegister: false,
      pwaAssets: { config: true, overrideManifestIcons: true },
      manifest,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,webmanifest}'],
        globIgnores: ['mediapipe/**', 'models/**', 'sw-notify.js'],
        navigateFallback: '/index.html',
        importScripts: ['sw-notify.js'],
        // ML runtime + model are big: cached on first use (or when a face trial is added), then work offline.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/mediapipe/') || url.pathname.startsWith('/models/'),
            handler: 'CacheFirst',
            options: { cacheName: 'vision-models', expiration: { maxEntries: 10 } },
          },
        ],
      },
      devOptions: { enabled: true, type: 'module', navigateFallback: 'index.html' },
    }),
  ],
})
