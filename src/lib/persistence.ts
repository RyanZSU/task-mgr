import type { ExportData } from '../types'
import { nowIso } from './dates'
import { useProjectStore } from '../stores/useProjectStore'
import { useTagStore } from '../stores/useTagStore'
import { useTaskStore } from '../stores/useTaskStore'
import { useRepeatStore } from '../stores/useRepeatStore'
import { useWorklogStore } from '../stores/useWorklogStore'
import { useScheduleStore } from '../stores/useScheduleStore'
import { useSummaryStore } from '../stores/useSummaryStore'
import { useSettingsStore } from '../stores/useSettingsStore'

export const SCHEMA_VERSION = 1

/** Gather the current state of every store into a single exportable object. */
export function collectExportData(): ExportData {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowIso(),
    projects: useProjectStore.getState().projects,
    tags: useTagStore.getState().tags,
    tasks: useTaskStore.getState().tasks,
    repeatCfgs: useRepeatStore.getState().repeatCfgs,
    attachments: useTaskStore.getState().attachments,
    worklog: useWorklogStore.getState().entries,
    schedule: useScheduleStore.getState().schedule,
    summaries: useSummaryStore.getState().summaries,
    settings: useSettingsStore.getState().settings,
  }
}

/** Download the full state as a JSON backup file. */
export function downloadExport() {
  const data = collectExportData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `task-manager-backup-${date}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null
}

/** Validate that an unknown value looks like an export file. Returns a list of problems (empty = valid). */
export function validateImport(data: unknown): string[] {
  if (!isRecord(data)) return ['File is not a valid JSON object.']
  const required = ['projects', 'tags', 'tasks', 'repeatCfgs', 'attachments', 'worklog', 'schedule', 'summaries', 'settings']
  const missing = required.filter((k) => !(k in data))
  if (missing.length) return [`Missing fields: ${missing.join(', ')}`]
  if (typeof data.schemaVersion !== 'number') return ['Missing schemaVersion.']
  return []
}

function unionById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of a) map.set(item.id, item)
  for (const item of b) map.set(item.id, item)
  return [...map.values()]
}

/** Apply imported data to all stores. `mode` = replace or merge (union by id). */
export function applyImport(data: ExportData, mode: 'replace' | 'merge') {
  const replace = mode === 'replace'

  useProjectStore.setState({ projects: replace ? data.projects : unionById(useProjectStore.getState().projects, data.projects) })
  useTagStore.setState({ tags: replace ? data.tags : unionById(useTagStore.getState().tags, data.tags) })
  useTaskStore.setState({
    tasks: replace ? data.tasks : unionById(useTaskStore.getState().tasks, data.tasks),
    attachments: replace ? data.attachments : unionById(useTaskStore.getState().attachments, data.attachments),
  })
  useRepeatStore.setState({
    repeatCfgs: replace ? data.repeatCfgs : unionById(useRepeatStore.getState().repeatCfgs, data.repeatCfgs),
  })
  useWorklogStore.setState({
    entries: replace ? data.worklog : unionById(useWorklogStore.getState().entries, data.worklog),
  })
  useSummaryStore.setState({
    summaries: replace ? data.summaries : unionById(useSummaryStore.getState().summaries, data.summaries),
  })
  useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, ...data.settings } })

  if (replace) {
    useScheduleStore.setState({ schedule: data.schedule })
  } else {
    const merged: Record<string, string[]> = { ...useScheduleStore.getState().schedule }
    for (const [day, ids] of Object.entries(data.schedule)) {
      merged[day] = [...new Set([...(merged[day] ?? []), ...ids])]
    }
    useScheduleStore.setState({ schedule: merged })
  }
}

/** Delete every stored collection (used by the "clear data" action). */
export function clearAllData() {
  useTaskStore.setState({ tasks: [], attachments: [] })
  useProjectStore.setState({ projects: [] })
  useTagStore.setState({ tags: [] })
  useRepeatStore.setState({ repeatCfgs: [] })
  useWorklogStore.setState({ entries: [] })
  useScheduleStore.setState({ schedule: {} })
  useSummaryStore.setState({ summaries: [] })
}