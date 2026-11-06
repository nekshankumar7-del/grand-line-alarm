import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(length = 30) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

export const normalizeCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, '')

export const groupCode = (code: string) => code.match(/.{1,5}/g)?.join('-') ?? code

interface SettingsState {
  backupCode: string | null
  backupCodeSeen: boolean
  ensureBackupCode(): string
  acknowledgeBackupCode(): void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      backupCode: null,
      backupCodeSeen: false,
      ensureBackupCode() {
        const existing = get().backupCode
        if (existing) return existing
        const code = generateCode()
        set({ backupCode: code, backupCodeSeen: false })
        return code
      },
      acknowledgeBackupCode: () => set({ backupCodeSeen: true }),
    }),
    { name: 'ns-settings' },
  ),
)
