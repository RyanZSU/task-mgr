import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { buildTheme } from './theme'
import { useSettingsStore } from './stores/useSettingsStore'
import { Shell } from './components/Shell'
import { DayPlanner } from './features/planner/DayPlanner'
import { TaskList } from './features/list/TaskList'
import { KanbanBoard } from './features/kanban/KanbanBoard'
import { Worklog } from './features/worklog/Worklog'
import { Metrics } from './features/metrics/Metrics'
import { FocusView } from './features/timer/FocusView'
import { Manage } from './features/manage/Manage'
import { Settings } from './features/settings/Settings'

function useResolvedTheme(): 'light' | 'dark' {
  const theme = useSettingsStore((s) => s.settings.theme)
  const [system, setSystem] = useState<'light' | 'dark'>(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystem(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return theme === 'system' ? system : theme
}

export default function App() {
  const mode = useResolvedTheme()
  const theme = useMemo(() => buildTheme(mode), [mode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter basename="/taskmgr">
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Navigate to="/day/today" replace />} />
            <Route path="/day/:dayKey" element={<DayPlanner />} />
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/board" element={<KanbanBoard />} />
            <Route path="/timeline" element={<Worklog />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/focus" element={<FocusView />} />
            <Route path="/manage" element={<Manage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/day/today" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}