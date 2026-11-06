import '@/storageMigration'
import '@/lib/perf'
import '@fontsource/bebas-neue'
import '@fontsource-variable/nunito'
import '@/styles/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { reloadOnceForNewVersion } from '@/app/RouteError'
import { migrateLegacyDb } from '@/db/db'
import { installAudioUnlock } from '@/audio/alarmSound'
import { initInstallListeners } from '@/pwa/installListeners'
import { registerServiceWorker } from '@/pwa/registerServiceWorker'

void migrateLegacyDb()
// A code-split file from an older deployment is gone → reload once into the new version.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  reloadOnceForNewVersion()
})
installAudioUnlock()
initInstallListeners()
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
