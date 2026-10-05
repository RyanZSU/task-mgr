import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { RepeatCfg } from '../types'
import { newId } from '../lib/id'
import { useTaskStore } from './useTaskStore'

interface RepeatStore {
  repeatCfgs: RepeatCfg[]
  addRepeatCfg: (cfg: Omit<RepeatCfg, 'id'>) => RepeatCfg
  updateRepeatCfg: (id: string, patch: Partial<RepeatCfg>) => void
  deleteRepeatCfg: (id: string) => void
  touchLastCreation: (id: string, key: string) => void
}

export const useRepeatStore = create<RepeatStore>()(
  persist(
    (set) => ({
      repeatCfgs: [],
      addRepeatCfg(cfg) {
        const item: RepeatCfg = { ...cfg, id: newId('r') }
        set((s) => ({ repeatCfgs: [...s.repeatCfgs, item] }))
        return item
      },
      updateRepeatCfg(id, patch) {
        set((s) => ({
          repeatCfgs: s.repeatCfgs.map((c) => (c.id === id ? { ...c, ...patch, id } : c)),
        }))
      },
      deleteRepeatCfg(id) {
        set((s) => ({ repeatCfgs: s.repeatCfgs.filter((c) => c.id !== id) }))
        useTaskStore.getState().onRepeatDeleted(id)
      },
      touchLastCreation(id, key) {
        set((s) => ({
          repeatCfgs: s.repeatCfgs.map((c) => (c.id === id ? { ...c, lastTaskCreation: key } : c)),
        }))
      },
    }),
    { name: 'sp:repeat', storage: createJSONStorage(() => localStorage) },
  ),
)