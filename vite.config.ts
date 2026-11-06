import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { manifest } from './pwa.manifest'

const APP_VERSION: string = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version
/**
 * Build id = fingerprint of the app's own code (src/, index.html, public/, package.json).
 * It only changes when the app really changes — so the in-app "Update available" prompt never
 * appears for commits that don't touch the app (docs, CI, etc.).
 */
const BUILD_ID = (() => {
  const hash = createHash('sha256')
  const root = fileURLToPath(new URL('.', import.meta.url))
  const walk = (dir: string) => {
    for (const name of readdirSync(dir).sort()) {
      if (name === 'mediapipe' || name === 'face-api') continue // generated copies
      const path = join(dir, name)
      if (statSync(path).isDirectory()) walk(path)
      // machine-independent path (same id on this PC and on Vercel)
      else hash.update(relative(root, path).split(sep).join('/')).update(readFileSync(path))
    }
  }
  for (const dir of ['src', 'public']) walk(join(root, dir))
  for (const file of ['index.html', 'package.json', 'pwa.manifest.ts']) hash.update(readFileSync(join(root, file)))
  return hash.digest('hex').slice(0, 7)
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
