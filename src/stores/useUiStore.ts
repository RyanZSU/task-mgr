import { create } from 'zustand'

export interface TaskDialogContext {
  taskId?: string
  parentId?: string
  projectId?: string
}

interface UiStore {
  searchQuery: string
  setSearchQuery: (q: string) => void
  taskDialog: TaskDialogContext | null
  openTaskDialog: (ctx?: TaskDialogContext) => void
  closeTaskDialog: () => void
}

export const useUiStore = create<UiStore>()((set) => ({
  searchQuery: '',
  setSearchQuery(q) {
    set({ searchQuery: q })
  },
  taskDialog: null,
  openTaskDialog(ctx = {}) {
    set({ taskDialog: ctx })
  },
  closeTaskDialog() {
    set({ taskDialog: null })
  },
}))