import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.nightsentinel.alarm',
  appName: 'Night Sentinel',
  webDir: 'dist',
  android: {
    // Keep the WebView alive and audible while an alarm is ringing.
    backgroundColor: '#020617',
  },
}

export default config
