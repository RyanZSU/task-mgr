import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Settings } from '../types'

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  isTrackIdleTime: true,
  minIdleTimeMs: 3 * 60_000,
  isNotifyOnBreakDone: true,
  pomodoro: {
    workMin: 25,
    breakMin: 5,
    longBreakMin: 15,
    longBreakInterval: 4,
    isManualContinue: false,
  },
}

interface SettingsStore {
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
  updatePomodoro: (patch: Partial<Settings['pomodoro']>) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings(patch) {
        set((s) => ({ settings: { ...s.settings, ...patch } }))
      },
      updatePomodoro(patch) {
        set((s) => ({ settings: { ...s.settings, pomodoro: { ...s.settings.pomodoro, ...patch } } }))
      },
    }),
    { name: 'sp:settings', storage: createJSONStorage(() => localStorage) },
  ),
)