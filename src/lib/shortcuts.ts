import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { todayKey } from './dates'
import { useUiStore } from '../stores/useUiStore'

export interface ShortcutDef {
  keys: string
  description: string
}

export const SHORTCUTS: ShortcutDef[] = [
  { keys: 'n', description: 'New task' },
  { keys: '1', description: 'Planner (today)' },
  { keys: '2', description: 'Task list' },
  { keys: '3', description: 'Kanban board' },
  { keys: '4', description: 'Worklog' },
  { keys: '5', description: 'Metrics' },
  { keys: '6', description: 'Focus timer' },
]

/**
 * Global keyboard shortcuts. Ignored while typing in an input/textarea/select
 * or when a dialog is open.
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate()
  const openTaskDialog = useUiStore((s) => s.openTaskDialog)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
        return
      }
      // Ignore when any dialog is open.
      if (document.querySelector('[role="dialog"]')) return

      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault()
          openTaskDialog()
          break
        case '1':
          navigate(`/day/${todayKey()}`)
          break
        case '2':
          navigate('/tasks')
          break
        case '3':
          navigate('/board')
          break
        case '4':
          navigate('/timeline')
          break
        case '5':
          navigate('/metrics')
          break
        case '6':
          navigate('/focus')
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate, openTaskDialog])
}