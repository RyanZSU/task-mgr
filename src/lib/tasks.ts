import type { Task } from '../types'

/** Direct child subtasks of a task. */
export function getSubtasks(tasks: Task[], parentId: string): Task[] {
  return sortByOrder(tasks.filter((t) => t.parentId === parentId))
}

/** Recursively collect a task id and all its descendants. */
export function collectSubtree(tasks: Task[], id: string): Set<string> {
  const out = new Set<string>([id])
  for (const t of tasks) {
    if (t.parentId && out.has(t.parentId)) {
      out.add(t.id)
    }
  }
  return out
}

export function sortByOrder(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt))
}

/** Case-insensitive search across title and notes. */
export function matchesSearch(task: Task, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    task.title.toLowerCase().includes(q) ||
    (task.notes?.toLowerCase().includes(q) ?? false)
  )
}

/** Luminance-based readable text color (black or white) for a colored background. */
export function contrastText(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return '#000000'
  const n = parseInt(m[1]!, 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  return lum > 160 ? '#000000' : '#ffffff'
}