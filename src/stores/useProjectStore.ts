import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Project } from '../types'
import { newId } from '../lib/id'
import { useTaskStore } from './useTaskStore'

const COLORS = [
  '#3f51b5',
  '#e53935',
  '#43a047',
  '#fb8c00',
  '#8e24aa',
  '#00acc1',
  '#6d4c41',
  '#546e7a',
  '#d81b60',
  '#7cb342',
]

interface ProjectStore {
  projects: Project[]
  addProject: (data: { title: string; color?: string; note?: string; parentId?: string }) => Project
  updateProject: (id: string, patch: Partial<Project>) => void
  deleteProject: (id: string) => void
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      addProject(data) {
        const project: Project = {
          id: newId('p'),
          title: data.title,
          color: data.color ?? COLORS[get().projects.length % COLORS.length],
          note: data.note,
          parentId: data.parentId,
        }
        set((s) => ({ projects: [...s.projects, project] }))
        return project
      },
      updateProject(id, patch) {
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch, id } : p)),
        }))
      },
      deleteProject(id) {
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id && p.parentId !== id),
        }))
        useTaskStore.getState().onProjectDeleted(id)
      },
    }),
    { name: 'sp:project', storage: createJSONStorage(() => localStorage) },
  ),
)