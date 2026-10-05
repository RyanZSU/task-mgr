import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { formatDurationShort } from '../../lib/format'
import { formatDayFull } from '../../lib/dates'
import { useTaskStore } from '../../stores/useTaskStore'
import { useScheduleStore } from '../../stores/useScheduleStore'
import { useWorklogStore } from '../../stores/useWorklogStore'
import { useSummaryStore } from '../../stores/useSummaryStore'

interface Props {
  open: boolean
  dayKey: string
  onClose: () => void
}

export function DailySummaryDialog({ open, dayKey, onClose }: Props) {
  const tasks = useTaskStore((s) => s.tasks)
  const schedule = useScheduleStore((s) => s.schedule)
  const entries = useWorklogStore((s) => s.entries)
  const summaries = useSummaryStore((s) => s.summaries)
  const upsertSummary = useSummaryStore((s) => s.upsertSummary)

  const existing = summaries.find((s) => s.dayKey === dayKey)
  const [summaryText, setSummaryText] = useState(existing?.summaryText ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')

  useEffect(() => {
    setSummaryText(existing?.summaryText ?? '')
    setNotes(existing?.notes ?? '')
  }, [dayKey, open])

  const dayIds = schedule[dayKey] ?? []
  const planned = dayIds.length
  const done = tasks.filter((t) => dayIds.includes(t.id) && t.isDone).length
  const timeMs = entries.filter((e) => e.date === dayKey).reduce((s, e) => s + e.timeSpentMs, 0)

  function save() {
    upsertSummary({ dayKey, summaryText, todosDone: done, notes })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Daily summary — {formatDayFull(dayKey)}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Planned: <strong>{planned}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Done: <strong>{done}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Time tracked: <strong>{formatDurationShort(timeMs)}</strong>
            </Typography>
          </Stack>
          <TextField
            label="How was your day? (summary)"
            multiline
            minRows={3}
            value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)}
          />
          <TextField label="Notes" multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}