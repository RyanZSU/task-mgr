import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PomodoroState, StopwatchState } from '../types'
import { todayKey } from '../lib/dates'
import { useTaskStore } from './useTaskStore'
import { useWorklogStore } from './useWorklogStore'

export interface StopwatchResult {
  taskId: string | null
  timeSpentMs: number
}

interface TimerStore {
  stopwatch: StopwatchState
  pomodoro: PomodoroState
  distraction: { logByDay: Record<string, number> }
  startStopwatch: (taskId: string) => void
  pauseStopwatch: () => void
  stopStopwatch: () => StopwatchResult
  resetStopwatch: () => void
  setPomodoro: (patch: Partial<PomodoroState>) => void
  incrementDistraction: () => void
}

const DEFAULT_POMODORO: PomodoroState = {
  mode: 'work',
  isRunning: false,
  endAt: null,
  remainingMs: 0,
  completedSessions: 0,
  cycleCount: 0,
  taskId: null,
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      stopwatch: { taskId: null, startedAt: null, accumulatedMs: 0 },
      pomodoro: DEFAULT_POMODORO,
      distraction: { logByDay: {} },
      startStopwatch(taskId) {
        set({ stopwatch: { taskId, startedAt: Date.now(), accumulatedMs: 0 } })
      },
      pauseStopwatch() {
        const { startedAt, accumulatedMs } = get().stopwatch
        if (startedAt == null) return
        const delta = Date.now() - startedAt
        set({ stopwatch: { ...get().stopwatch, startedAt: null, accumulatedMs: accumulatedMs + delta } })
      },
      stopStopwatch() {
        const { taskId, startedAt, accumulatedMs } = get().stopwatch
        const elapsed = accumulatedMs + (startedAt ? Date.now() - startedAt : 0)
        const rounded = Math.round(elapsed)
        if (rounded > 0 && taskId) {
          const task = useTaskStore.getState().tasks.find((t) => t.id === taskId)
          useTaskStore.getState().addTimeSpent(taskId, rounded)
          useWorklogStore.getState().addEntry({
            taskId,
            date: todayKey(),
            startedAt: new Date().toISOString(),
            timeSpentMs: rounded,
            projectId: task?.projectId,
            title: task?.title,
          })
        }
        set({ stopwatch: { taskId: null, startedAt: null, accumulatedMs: 0 } })
        return { taskId, timeSpentMs: rounded }
      },
      resetStopwatch() {
        set({ stopwatch: { taskId: null, startedAt: null, accumulatedMs: 0 } })
      },
      setPomodoro(patch) {
        set((s) => ({ pomodoro: { ...s.pomodoro, ...patch } }))
      },
      incrementDistraction() {
        const key = todayKey()
        set((s) => ({
          distraction: {
            logByDay: { ...s.distraction.logByDay, [key]: (s.distraction.logByDay[key] ?? 0) + 1 },
          },
        }))
      },
    }),
    { name: 'sp:timer', storage: createJSONStorage(() => localStorage) },
  ),
)

/** Current live stopwatch duration in ms. */
export function stopwatchElapsed(sw: StopwatchState): number {
  return sw.accumulatedMs + (sw.startedAt ? Date.now() - sw.startedAt : 0)
}

/** Current pomodoro remaining time in ms. */
export function pomodoroRemaining(p: PomodoroState): number {
  if (p.isRunning && p.endAt != null) return Math.max(0, p.endAt - Date.now())
  return Math.max(0, p.remainingMs)
}