import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { WorklogEntry } from '../types'
import { newId } from '../lib/id'

interface WorklogState {
  entries: WorklogEntry[]
  addEntry: (e: Omit<WorklogEntry, 'id'>) => WorklogEntry
  updateEntry: (id: string, patch: Partial<WorklogEntry>) => void
  deleteEntry: (id: string) => void
  removeForTasks: (ids: string[]) => void
}

export const useWorklogStore = create<WorklogState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry(e) {
        const entry: WorklogEntry = { ...e, id: newId('w') }
        set((s) => ({ entries: [...s.entries, entry] }))
        return entry
      },
      updateEntry(id, patch) {
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch, id } : e)),
        }))
      },
      deleteEntry(id) {
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }))
      },
      removeForTasks(ids) {
        const idSet = new Set(ids)
        set((s) => ({ entries: s.entries.filter((e) => !e.taskId || !idSet.has(e.taskId)) }))
      },
    }),
    { name: 'sp:worklog', storage: createJSONStorage(() => localStorage) },
  ),
)