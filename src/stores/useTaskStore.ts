import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Attachment, Task } from '../types'
import { newId } from '../lib/id'
import { nowIso } from '../lib/dates'
import { useWorklogStore } from './useWorklogStore'
import { useScheduleStore } from './useScheduleStore'

export type TaskInput = Partial<Task> & { title: string }

interface TaskStore {
  tasks: Task[]
  attachments: Attachment[]
  addTask: (input: TaskInput) => Task
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTask: (id: string) => void
  addTimeSpent: (id: string, ms: number) => void
  addAttachment: (a: Omit<Attachment, 'id'>) => Attachment
  deleteAttachment: (id: string) => void
  onProjectDeleted: (projectId: string) => void
  onTagDeleted: (tagId: string) => void
  onRepeatDeleted: (cfgId: string) => void
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      attachments: [],
      addTask(input) {
        const task: Task = {
          id: newId('t'),
          title: input.title,
          notes: input.notes,
          projectId: input.projectId,
          tagIds: input.tagIds ?? [],
          parentId: input.parentId,
          isDone: input.isDone ?? false,
          dueDate: input.dueDate,
          timeEstimateMs: input.timeEstimateMs,
          timeSpentMs: input.timeSpentMs ?? 0,
          repeatCfgId: input.repeatCfgId,
          attachmentIds: input.attachmentIds ?? [],
          createdAt: input.createdAt ?? nowIso(),
          order: input.order ?? get().tasks.length,
        }
        set((s) => ({ tasks: [...s.tasks, task] }))
        return task
      },
      updateTask(id, patch) {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch, id } : t)),
        }))
      },
      toggleTask(id) {
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t
            const isDone = !t.isDone
            return { ...t, isDone, completedAt: isDone ? nowIso() : undefined }
          }),
        }))
      },
      addTimeSpent(id, ms) {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, timeSpentMs: Math.max(0, t.timeSpentMs + ms) } : t,
          ),
        }))
      },
      deleteTask(id) {
        const descendants = new Set<string>()
        const collect = (parentId: string) => {
          for (const t of get().tasks) {
            if (t.parentId === parentId && !descendants.has(t.id)) {
              descendants.add(t.id)
              collect(t.id)
            }
          }
        }
        collect(id)
        const allIds = new Set([id, ...descendants])
        const attachIds = new Set(
          get()
            .tasks.filter((t) => allIds.has(t.id))
            .flatMap((t) => t.attachmentIds),
        )
        set((s) => ({
          tasks: s.tasks.filter((t) => !allIds.has(t.id)),
          attachments: s.attachments.filter((a) => !attachIds.has(a.id)),
        }))
        useWorklogStore.getState().removeForTasks([...allIds])
        useScheduleStore.getState().removeTasks([...allIds])
      },
      addAttachment(a) {
        const attachment: Attachment = { ...a, id: newId('a') }
        set((s) => ({ attachments: [...s.attachments, attachment] }))
        return attachment
      },
      deleteAttachment(id) {
        set((s) => ({
          attachments: s.attachments.filter((a) => a.id !== id),
          tasks: s.tasks.map((t) =>
            t.attachmentIds.includes(id) ? { ...t, attachmentIds: t.attachmentIds.filter((x) => x !== id) } : t,
          ),
        }))
      },
      onProjectDeleted(projectId) {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.projectId === projectId ? { ...t, projectId: undefined } : t,
          ),
        }))
      },
      onTagDeleted(tagId) {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.tagIds.includes(tagId) ? { ...t, tagIds: t.tagIds.filter((x) => x !== tagId) } : t,
          ),
        }))
      },
      onRepeatDeleted(cfgId) {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.repeatCfgId === cfgId ? { ...t, repeatCfgId: undefined } : t,
          ),
        }))
      },
    }),
    {
      name: 'sp:task',
      storage: createJSONStorage(() => localStorage),
      // Persist the whole store except nothing — attachments are kept too.
    },
  ),
)

/** Selector helper: all tasks that are not subtasks (no parentId). */
export function selectRootTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.parentId)
}