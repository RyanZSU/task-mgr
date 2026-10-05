// Domain types for the offline task manager.

export type ThemeMode = 'light' | 'dark' | 'system'

export interface Project {
  id: string
  title: string
  color: string
  note?: string
  isHidden?: boolean
  isArchived?: boolean
  parentId?: string
}

export interface Tag {
  id: string
  title: string
  color: string
}

export type RepeatType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'

export interface RepeatCfg {
  id: string
  title: string
  type: RepeatType
  /** For `custom`: repeat every N days. For others: every N units. */
  interval: number
  /** 0 (Sun) - 6 (Sat), for `weekly`. */
  weekday?: number
  /** 1 - 31, for `monthly` / `yearly`. */
  dayOfMonth?: number
  /** 0 (Jan) - 11 (Dec), for `yearly`. */
  month?: number
  /** DayKey of the most recent occurrence that was generated. */
  lastTaskCreation?: string
}

export interface Attachment {
  id: string
  name: string
  mimeType: string
  dataUrl: string
  size: number
}

export interface Task {
  id: string
  title: string
  notes?: string
  projectId?: string
  tagIds: string[]
  /** Subtasks are full tasks with a parentId. */
  parentId?: string
  isDone: boolean
  /** ISO timestamp of when the task was marked done (for metrics). */
  completedAt?: string
  /** ISO date (date-only) for when the task is due. */
  dueDate?: string
  timeEstimateMs?: number
  timeSpentMs: number
  repeatCfgId?: string
  attachmentIds: string[]
  createdAt: string
  order: number
}

export interface WorklogEntry {
  id: string
  taskId?: string
  /** DayKey the time belongs to (YYYY-MM-DD). */
  date: string
  /** ISO timestamp of when the entry was created/stopped. */
  startedAt: string
  timeSpentMs: number
  note?: string
  // Denormalized for metrics when the source task is deleted.
  projectId?: string
  title?: string
}

export interface DailySummary {
  id: string
  dayKey: string
  summaryText: string
  todosDone: number
  notes: string
}

export interface PomodoroSettings {
  workMin: number
  breakMin: number
  longBreakMin: number
  longBreakInterval: number
  isManualContinue: boolean
}

export interface Settings {
  theme: ThemeMode
  isTrackIdleTime: boolean
  minIdleTimeMs: number
  isNotifyOnBreakDone: boolean
  pomodoro: PomodoroSettings
}

export type Schedule = Record<string, string[]>

export type PomodoroMode = 'work' | 'break' | 'longBreak'

export interface StopwatchState {
  taskId: string | null
  startedAt: number | null
  accumulatedMs: number
}

export interface PomodoroState {
  mode: PomodoroMode
  isRunning: boolean
  endAt: number | null
  remainingMs: number
  completedSessions: number
  cycleCount: number
  taskId: string | null
}

export interface TimerState {
  stopwatch: StopwatchState
  pomodoro: PomodoroState
  distraction: { logByDay: Record<string, number> }
}

/** Shape of a full export/backup file. */
export interface ExportData {
  schemaVersion: number
  exportedAt: string
  projects: Project[]
  tags: Tag[]
  tasks: Task[]
  repeatCfgs: RepeatCfg[]
  attachments: Attachment[]
  worklog: WorklogEntry[]
  schedule: Schedule
  summaries: DailySummary[]
  settings: Settings
}