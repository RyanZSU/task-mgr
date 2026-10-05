import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import StopIcon from '@mui/icons-material/Stop'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import ReplayIcon from '@mui/icons-material/Replay'
import AddIcon from '@mui/icons-material/Add'
import { useTimerStore, pomodoroRemaining, stopwatchElapsed } from '../../stores/useTimerStore'
import { useTaskStore } from '../../stores/useTaskStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { formatClock, formatDuration } from '../../lib/format'
import { todayKey } from '../../lib/dates'
import type { PomodoroMode, PomodoroSettings } from '../../types'

function durationOf(mode: PomodoroMode, s: PomodoroSettings): number {
  if (mode === 'break') return s.breakMin * 60_000
  if (mode === 'longBreak') return s.longBreakMin * 60_000
  return s.workMin * 60_000
}

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)
    osc.start()
    osc.stop(ctx.currentTime + 0.7)
  } catch {
    /* audio unavailable */
  }
}

function PomodoroPanel() {
  const p = useTimerStore((s) => s.pomodoro)
  const setPomodoro = useTimerStore((s) => s.setPomodoro)
  const settings = useSettingsStore((s) => s.settings.pomodoro)
  const tasks = useTaskStore((s) => s.tasks)
  const [, forceTick] = useState(0)

  const remaining = pomodoroRemaining(p)
  const task = p.taskId ? tasks.find((t) => t.id === p.taskId) : undefined

  useEffect(() => {
    if (!p.isRunning) return
    const id = setInterval(() => {
      const st = useTimerStore.getState().pomodoro
      if (pomodoroRemaining(st) <= 0) {
        let next: PomodoroMode
        let completedSessions = st.completedSessions
        let cycleCount = st.cycleCount
        if (st.mode === 'work') {
          completedSessions += 1
          cycleCount += 1
          next = cycleCount >= useSettingsStore.getState().settings.pomodoro.longBreakInterval ? 'longBreak' : 'break'
          if (next === 'longBreak') cycleCount = 0
        } else {
          next = 'work'
        }
        const autoStart = st.mode === 'work' ? !useSettingsStore.getState().settings.pomodoro.isManualContinue : true
        const dur = durationOf(next, useSettingsStore.getState().settings.pomodoro)
        useTimerStore.getState().setPomodoro({
          mode: next,
          isRunning: autoStart,
          endAt: autoStart ? Date.now() + dur : null,
          remainingMs: dur,
          completedSessions,
          cycleCount,
        })
        if (useSettingsStore.getState().settings.isNotifyOnBreakDone) beep()
      }
      forceTick((t) => t + 1)
    }, 300)
    return () => clearInterval(id)
  }, [p.isRunning])

  function start() {
    const dur = remaining > 0 ? remaining : durationOf(p.mode, settings)
    setPomodoro({ isRunning: true, endAt: Date.now() + dur, remainingMs: dur })
  }
  function pause() {
    setPomodoro({ isRunning: false, endAt: null, remainingMs: remaining })
  }
  function reset() {
    setPomodoro({
      mode: 'work',
      isRunning: false,
      endAt: null,
      remainingMs: durationOf('work', settings),
      completedSessions: 0,
      cycleCount: 0,
    })
  }
  function skip() {
    const next: PomodoroMode = p.mode === 'work' ? 'break' : 'work'
    const dur = durationOf(next, settings)
    setPomodoro({ mode: next, isRunning: false, endAt: null, remainingMs: dur })
  }

  const modeLabel = p.mode === 'work' ? 'Focus' : p.mode === 'longBreak' ? 'Long break' : 'Break'

  return (
    <Paper variant="outlined" sx={{ p: 2.5, textAlign: 'center' }}>
      <Typography variant="overline" color="text.secondary">
        Pomodoro · {modeLabel}
      </Typography>
      <Typography variant="h2" sx={{ my: 1, fontVariantNumeric: 'tabular-nums', fontWeight: 300 }}>
        {formatClock(remaining)}
      </Typography>
      {task && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {task.title}
        </Typography>
      )}
      <Select
        size="small"
        displayEmpty
        fullWidth
        value={p.taskId ?? ''}
        onChange={(e) => setPomodoro({ taskId: e.target.value || null })}
        sx={{ mb: 2, textAlign: 'left' }}
      >
        <MenuItem value="">No task</MenuItem>
        {tasks.filter((t) => !t.parentId).map((t) => (
          <MenuItem key={t.id} value={t.id}>
            {t.title}
          </MenuItem>
        ))}
      </Select>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
        {p.isRunning ? (
          <Button variant="contained" startIcon={<PauseIcon />} onClick={pause}>
            Pause
          </Button>
        ) : (
          <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={start}>
            Start
          </Button>
        )}
        <IconButton onClick={skip} title="Skip">
          <SkipNextIcon />
        </IconButton>
        <IconButton onClick={reset} title="Reset">
          <ReplayIcon />
        </IconButton>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        Completed {p.completedSessions} session{p.completedSessions === 1 ? '' : 's'}
      </Typography>
    </Paper>
  )
}

function StopwatchPanel() {
  const sw = useTimerStore((s) => s.stopwatch)
  const startStopwatch = useTimerStore((s) => s.startStopwatch)
  const pauseStopwatch = useTimerStore((s) => s.pauseStopwatch)
  const stopStopwatch = useTimerStore((s) => s.stopStopwatch)
  const resetStopwatch = useTimerStore((s) => s.resetStopwatch)
  const tasks = useTaskStore((s) => s.tasks)
  const [, forceTick] = useState(0)
  const [lastTracked, setLastTracked] = useState<string | null>(null)

  const running = sw.startedAt != null
  const elapsed = stopwatchElapsed(sw)
  const task = sw.taskId ? tasks.find((t) => t.id === sw.taskId) : undefined

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => forceTick((t) => t + 1), 300)
    return () => clearInterval(id)
  }, [running])

  function stop() {
    const res = stopStopwatch()
    if (res.timeSpentMs > 0) setLastTracked(formatDuration(res.timeSpentMs))
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5, textAlign: 'center' }}>
      <Typography variant="overline" color="text.secondary">
        Stopwatch
      </Typography>
      <Typography variant="h3" sx={{ my: 1, fontVariantNumeric: 'tabular-nums', fontWeight: 300 }}>
        {formatClock(elapsed)}
      </Typography>
      {task && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {task.title}
        </Typography>
      )}
      <Select
        size="small"
        displayEmpty
        fullWidth
        value={sw.taskId ?? ''}
        onChange={(e) => {
          useTimerStore.setState({ stopwatch: { taskId: e.target.value || null, startedAt: null, accumulatedMs: 0 } })
        }}
        sx={{ mb: 2, textAlign: 'left' }}
      >
        <MenuItem value="">No task</MenuItem>
        {tasks.filter((t) => !t.parentId).map((t) => (
          <MenuItem key={t.id} value={t.id}>
            {t.title}
          </MenuItem>
        ))}
      </Select>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
        {running ? (
          <>
            <Button variant="contained" startIcon={<PauseIcon />} onClick={pauseStopwatch}>
              Pause
            </Button>
            <Button variant="outlined" startIcon={<StopIcon />} onClick={stop}>
              Stop
            </Button>
          </>
        ) : (
          <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => sw.taskId && startStopwatch(sw.taskId)} disabled={!sw.taskId}>
            Start
          </Button>
        )}
        <IconButton onClick={resetStopwatch} title="Reset">
          <ReplayIcon />
        </IconButton>
      </Stack>
      {lastTracked && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          Tracked {lastTracked}
        </Typography>
      )}
    </Paper>
  )
}

export function FocusView() {
  const incrementDistraction = useTimerStore((s) => s.incrementDistraction)
  const logByDay = useTimerStore((s) => s.distraction.logByDay)
  const settings = useSettingsStore((s) => s.settings)
  const sw = useTimerStore((s) => s.stopwatch)
  const pauseStopwatch = useTimerStore((s) => s.pauseStopwatch)

  const lastActivity = useRef(Date.now())
  const [idleNote, setIdleNote] = useState(false)

  useEffect(() => {
    function mark() {
      lastActivity.current = Date.now()
      setIdleNote(false)
    }
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'mousemove', 'touchstart']
    events.forEach((e) => window.addEventListener(e, mark))
    return () => events.forEach((e) => window.removeEventListener(e, mark))
  }, [])

  useEffect(() => {
    if (!settings.isTrackIdleTime) return
    const id = setInterval(() => {
      const { stopwatch } = useTimerStore.getState()
      if (stopwatch.startedAt == null) return
      if (Date.now() - lastActivity.current > settings.minIdleTimeMs) {
        pauseStopwatch()
        setIdleNote(true)
      }
    }, 5000)
    return () => clearInterval(id)
  }, [settings.isTrackIdleTime, settings.minIdleTimeMs, pauseStopwatch])

  const todayCount = logByDay[todayKey()] ?? 0

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: 2, pb: 6 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Focus
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'stretch' }}>
        <Box sx={{ flex: 1 }}>
          <PomodoroPanel />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StopwatchPanel />
        </Box>
      </Stack>

      {sw.startedAt != null && (
        <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1.5 }}>
          ● Tracking a task — see the planner or task list to stop it there too.
        </Typography>
      )}
      {idleNote && (
        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
          Stopwatch paused due to inactivity.
        </Typography>
      )}

      <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
        <Typography variant="overline" color="text.secondary">
          Anti-distraction
        </Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mt: 1 }}>
          <Button variant="contained" color="error" startIcon={<AddIcon />} onClick={incrementDistraction}>
            I got distracted
          </Button>
          <Typography variant="body2" color="text.secondary">
            Today: <strong>{todayCount}</strong>
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Use the button each time you catch yourself drifting off task — the tally shows up in Metrics.
        </Typography>
      </Paper>
    </Box>
  )
}