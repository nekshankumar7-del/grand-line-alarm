import '@/storageMigration'
import '@fontsource/bebas-neue'
import '@fontsource-variable/nunito'
import '@/styles/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { migrateLegacyDb } from '@/db/db'
import { installAudioUnlock } from '@/audio/alarmSound'
import { initInstallListeners } from '@/pwa/installListeners'
import { registerServiceWorker } from '@/pwa/registerServiceWorker'

void migrateLegacyDb()
installAudioUnlock()
initInstallListeners()
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
