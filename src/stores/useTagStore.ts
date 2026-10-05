import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Tag } from '../types'
import { newId } from '../lib/id'
import { useTaskStore } from './useTaskStore'

const COLORS = ['#e53935', '#43a047', '#fb8c00', '#8e24aa', '#00acc1', '#6d4c41', '#3f51b5', '#d81b60']

interface TagStore {
  tags: Tag[]
  addTag: (data: { title: string; color?: string }) => Tag
  updateTag: (id: string, patch: Partial<Tag>) => void
  deleteTag: (id: string) => void
}

export const useTagStore = create<TagStore>()(
  persist(
    (set, get) => ({
      tags: [],
      addTag(data) {
        const tag: Tag = {
          id: newId('tg'),
          title: data.title,
          color: data.color ?? COLORS[get().tags.length % COLORS.length],
        }
        set((s) => ({ tags: [...s.tags, tag] }))
        return tag
      },
      updateTag(id, patch) {
        set((s) => ({ tags: s.tags.map((t) => (t.id === id ? { ...t, ...patch, id } : t)) }))
      },
      deleteTag(id) {
        set((s) => ({ tags: s.tags.filter((t) => t.id !== id) }))
        useTaskStore.getState().onTagDeleted(id)
      },
    }),
    { name: 'sp:tag', storage: createJSONStorage(() => localStorage) },
  ),
)