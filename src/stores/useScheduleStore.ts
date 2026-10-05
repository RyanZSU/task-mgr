import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Schedule } from '../types'

interface ScheduleStore {
  schedule: Schedule
  scheduleTask: (taskId: string, dayKey: string) => void
  unscheduleTask: (taskId: string, dayKey: string) => void
  moveTask: (taskId: string, fromDay: string, toDay: string) => void
  setDayOrder: (dayKey: string, taskIds: string[]) => void
  removeTasks: (ids: string[]) => void
}

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set) => ({
      schedule: {},
      scheduleTask(taskId, dayKey) {
        set((s) => {
          const existing = s.schedule[dayKey] ?? []
          if (existing.includes(taskId)) return {}
          return { schedule: { ...s.schedule, [dayKey]: [...existing, taskId] } }
        })
      },
      unscheduleTask(taskId, dayKey) {
        set((s) => ({
          schedule: {
            ...s.schedule,
            [dayKey]: (s.schedule[dayKey] ?? []).filter((id) => id !== taskId),
          },
        }))
      },
      moveTask(taskId, fromDay, toDay) {
        set((s) => {
          const from = (s.schedule[fromDay] ?? []).filter((id) => id !== taskId)
          const to = [...(s.schedule[toDay] ?? [])]
          if (!to.includes(taskId)) to.push(taskId)
          return { schedule: { ...s.schedule, [fromDay]: from, [toDay]: to } }
        })
      },
      setDayOrder(dayKey, taskIds) {
        set((s) => ({ schedule: { ...s.schedule, [dayKey]: taskIds } }))
      },
      removeTasks(ids) {
        const idSet = new Set(ids)
        set((s) => {
          const next: Schedule = {}
          for (const [day, ids] of Object.entries(s.schedule)) {
            const filtered = ids.filter((id) => !idSet.has(id))
            if (filtered.length) next[day] = filtered
          }
          return { schedule: next }
        })
      },
    }),
    { name: 'sp:schedule', storage: createJSONStorage(() => localStorage) },
  ),
)