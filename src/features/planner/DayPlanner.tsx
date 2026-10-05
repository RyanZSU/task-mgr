import { useState } from 'react'
import { Box, Button, IconButton, Paper, Stack, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Clear'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import TodayIcon from '@mui/icons-material/Today'
import SummarizeIcon from '@mui/icons-material/EventNote'
import { useNavigate, useParams } from 'react-router-dom'
import { useTaskStore } from '../../stores/useTaskStore'
import { useScheduleStore } from '../../stores/useScheduleStore'
import { useUiStore } from '../../stores/useUiStore'
import { addDaysToKey, formatDayFull, todayKey } from '../../lib/dates'
import { sortByOrder } from '../../lib/tasks'
import { formatDurationShort } from '../../lib/format'
import { TaskCard } from '../tasks/TaskCard'
import { DailySummaryDialog } from '../summary/DailySummary'

export function DayPlanner() {
  const params = useParams()
  const rawDay = params.dayKey ?? todayKey()
  const dayKey = rawDay === 'today' ? todayKey() : rawDay
  const navigate = useNavigate()
  const tasks = useTaskStore((s) => s.tasks)
  const addTask = useTaskStore((s) => s.addTask)
  const schedule = useScheduleStore((s) => s.schedule)
  const scheduleTask = useScheduleStore((s) => s.scheduleTask)
  const unscheduleTask = useScheduleStore((s) => s.unscheduleTask)
  const openTaskDialog = useUiStore((s) => s.openTaskDialog)

  const [quick, setQuick] = useState('')
  const [summaryOpen, setSummaryOpen] = useState(false)

  const dayIds = schedule[dayKey] ?? []
  const scheduled = sortByOrder(tasks.filter((t) => dayIds.includes(t.id)))
  const due = sortByOrder(tasks.filter((t) => !t.isDone && t.dueDate === dayKey && !dayIds.includes(t.id)))
  const backlog = sortByOrder(
    tasks.filter((t) => !t.isDone && !t.parentId && !dayIds.includes(t.id) && !t.dueDate),
  )

  const doneCount = scheduled.filter((t) => t.isDone).length
  const totalEst = scheduled.reduce((s, t) => s + (t.timeEstimateMs ?? 0), 0)
  const totalSpent = scheduled.reduce((s, t) => s + t.timeSpentMs, 0)

  function quickAdd() {
    const title = quick.trim()
    if (!title) return
    const task = addTask({ title, isDone: false, timeSpentMs: 0 })
    scheduleTask(task.id, dayKey)
    setQuick('')
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, pb: 6 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: 'center' }}>
        <IconButton onClick={() => navigate(`/day/${addDaysToKey(dayKey, -1)}`)}>
          <ChevronLeftIcon />
        </IconButton>
        <IconButton onClick={() => navigate('/day/today')} title="Go to today">
          <TodayIcon />
        </IconButton>
        <IconButton onClick={() => navigate(`/day/${addDaysToKey(dayKey, 1)}`)}>
          <ChevronRightIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
          {formatDayFull(dayKey)}
        </Typography>
        <Button size="small" startIcon={<SummarizeIcon />} onClick={() => setSummaryOpen(true)}>
          Summary
        </Button>
      </Stack>

      <Paper sx={{ p: 1.5, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Add a task to this day and press Enter"
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && quickAdd()}
          slotProps={{
            input: {
              endAdornment: (
                <IconButton size="small" onClick={quickAdd} disabled={!quick.trim()}>
                  <AddIcon fontSize="inherit" />
                </IconButton>
              ),
            },
          }}
        />
        <Stack direction="row" spacing={2} sx={{ mt: 1, color: 'text.secondary' }}>
          <Typography variant="caption">
            {doneCount}/{scheduled.length} done
          </Typography>
          <Typography variant="caption">est {formatDurationShort(totalEst)}</Typography>
          <Typography variant="caption">spent {formatDurationShort(totalSpent)}</Typography>
          {totalEst > 0 && (
            <Typography variant="caption">
              remaining {formatDurationShort(Math.max(0, totalEst - totalSpent))}
            </Typography>
          )}
        </Stack>
      </Paper>

      <Typography variant="overline" color="text.secondary">
        Scheduled
      </Typography>
      {scheduled.map((t) => (
        <Stack key={t.id} direction="row" sx={{ alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1 }}>
            <TaskCard task={t} />
          </Box>
          <IconButton size="small" onClick={() => unscheduleTask(t.id, dayKey)} title="Remove from this day">
            <RemoveIcon fontSize="inherit" />
          </IconButton>
        </Stack>
      ))}
      {scheduled.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
          Nothing scheduled. Add a task above, or pull one from the backlog below.
        </Typography>
      )}

      {due.length > 0 && (
        <>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Due this day
          </Typography>
          {due.map((t) => (
            <Stack key={t.id} direction="row" sx={{ alignItems: 'center' }}>
              <Box sx={{ flexGrow: 1 }}>
                <TaskCard task={t} />
              </Box>
              <IconButton size="small" onClick={() => scheduleTask(t.id, dayKey)} title="Add to this day">
                <AddIcon fontSize="inherit" />
              </IconButton>
            </Stack>
          ))}
        </>
      )}

      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Backlog
      </Typography>
      {backlog.slice(0, 20).map((t) => (
        <Stack key={t.id} direction="row" sx={{ alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1 }}>
            <TaskCard task={t} />
          </Box>
          <IconButton size="small" onClick={() => scheduleTask(t.id, dayKey)} title="Schedule to this day">
            <AddIcon fontSize="inherit" />
          </IconButton>
        </Stack>
      ))}
      {backlog.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
          No backlog. Press <strong>n</strong> or click the + button to create a task.
        </Typography>
      )}
      <Button sx={{ mt: 2 }} startIcon={<AddIcon />} onClick={() => openTaskDialog()}>
        New task
      </Button>

      <DailySummaryDialog open={summaryOpen} dayKey={dayKey} onClose={() => setSummaryOpen(false)} />
    </Box>
  )
}