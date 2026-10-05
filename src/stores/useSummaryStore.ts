import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DailySummary } from '../types'
import { newId } from '../lib/id'

interface SummaryStore {
  summaries: DailySummary[]
  upsertSummary: (summary: Omit<DailySummary, 'id'>) => void
  deleteSummary: (id: string) => void
}

export const useSummaryStore = create<SummaryStore>()(
  persist(
    (set) => ({
      summaries: [],
      upsertSummary(summary) {
        set((s) => {
          const existing = s.summaries.find((x) => x.dayKey === summary.dayKey)
          if (existing) {
            return {
              summaries: s.summaries.map((x) => (x.dayKey === summary.dayKey ? { ...x, ...summary } : x)),
            }
          }
          return { summaries: [...s.summaries, { ...summary, id: newId('s') }] }
        })
      },
      deleteSummary(id) {
        set((s) => ({ summaries: s.summaries.filter((x) => x.id !== id) }))
      },
    }),
    { name: 'sp:summary', storage: createJSONStorage(() => localStorage) },
  ),
)