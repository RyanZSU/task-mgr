import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { useWorklogStore } from '../../stores/useWorklogStore'
import { useTaskStore } from '../../stores/useTaskStore'
import { useProjectStore } from '../../stores/useProjectStore'
import { TimeInput } from '../../components/TimeInput'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { formatDayFull, todayKey } from '../../lib/dates'
import { formatDuration, formatDurationShort } from '../../lib/format'
import type { WorklogEntry } from '../../types'

interface EntryDialogProps {
  open: boolean
  entry?: WorklogEntry
  defaultDate: string
  onClose: () => void
}

function EntryDialog({ open, entry, defaultDate, onClose }: EntryDialogProps) {
  const tasks = useTaskStore((s) => s.tasks)
  const addEntry = useWorklogStore((s) => s.addEntry)
  const updateEntry = useWorklogStore((s) => s.updateEntry)

  const [taskId, setTaskId] = useState(entry?.taskId ?? '')
  const [title, setTitle] = useState(entry?.title ?? '')
  const [date, setDate] = useState(entry?.date ?? defaultDate)
  const [timeMs, setTimeMs] = useState<number | undefined>(entry?.timeSpentMs)
  const [note, setNote] = useState(entry?.note ?? '')

  function save() {
    if (!timeMs || timeMs <= 0) return
    const task = tasks.find((t) => t.id === taskId)
    const base = {
      taskId: taskId || undefined,
      date,
      startedAt: entry?.startedAt ?? new Date().toISOString(),
      timeSpentMs: timeMs,
      note: note || undefined,
      projectId: task?.projectId,
      title: taskId ? task?.title : title.trim() || 'Untitled',
    }
    if (entry) updateEntry(entry.id, base)
    else addEntry(base)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{entry ? 'Edit time entry' : 'Log time'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Select size="small" displayEmpty value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <MenuItem value="">No task (manual entry)</MenuItem>
            {tasks
              .filter((t) => !t.parentId)
              .map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.title}
                </MenuItem>
              ))}
          </Select>
          {!taskId && (
            <TextField size="small" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          )}
          <TextField
            size="small"
            type="date"
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TimeInput label="Duration" value={timeMs} onChange={(v) => setTimeMs(v)} />
          <TextField size="small" label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!timeMs || timeMs <= 0} onClick={save}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function Worklog() {
  const entries = useWorklogStore((s) => s.entries)
  const deleteEntry = useWorklogStore((s) => s.deleteEntry)
  const projects = useProjectStore((s) => s.projects)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WorklogEntry | undefined>()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [entries],
  )

  const groups = useMemo(() => {
    const map = new Map<string, WorklogEntry[]>()
    for (const e of sorted) {
      if (!map.has(e.date)) map.set(e.date, [])
      map.get(e.date)!.push(e)
    }
    return [...map.entries()]
  }, [sorted])

  const totalMs = entries.reduce((s, e) => s + e.timeSpentMs, 0)

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, pb: 6 }}>
      <Stack direction="row" sx={{ alignItems: 'center', mb: 1.5 }}>
        <Typography variant="h6">Worklog</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          Total {formatDuration(totalMs)}
        </Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} sx={{ ml: 'auto' }} onClick={() => { setEditing(undefined); setDialogOpen(true) }}>
          Log time
        </Button>
      </Stack>

      {groups.map(([date, list]) => {
        const dayTotal = list.reduce((s, e) => s + e.timeSpentMs, 0)
        return (
          <Box key={date} sx={{ mb: 2.5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
              <Typography variant="overline" color="text.secondary">
                {formatDayFull(date)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDurationShort(dayTotal)}
              </Typography>
            </Stack>
            {list.map((e) => {
              const project = e.projectId ? projects.find((p) => p.id === e.projectId) : undefined
              return (
                <Paper key={e.id} variant="outlined" sx={{ px: 1.5, py: 0.75, mb: 0.5 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    {project && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: project.color }} />}
                    <Typography variant="body2" sx={{ flexGrow: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.title ?? 'Untitled'}
                    </Typography>
                    {e.note && (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                        {e.note}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatDuration(e.timeSpentMs)}
                    </Typography>
                    <IconButton size="small" onClick={() => { setEditing(e); setDialogOpen(true) }}>
                      <EditIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteId(e.id)}>
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </Stack>
                </Paper>
              )
            })}
          </Box>
        )
      })}

      {entries.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No tracked time yet. Start a stopwatch on a task or log time manually.
        </Typography>
      )}

      <EntryDialog
        key={editing?.id ?? 'new'}
        open={dialogOpen}
        entry={editing}
        defaultDate={todayKey()}
        onClose={() => setDialogOpen(false)}
      />
      <ConfirmDialog
        open={deleteId != null}
        title="Delete entry?"
        message="This time entry will be removed."
        confirmLabel="Delete"
        danger
        onConfirm={() => deleteId && deleteEntry(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </Box>
  )
}