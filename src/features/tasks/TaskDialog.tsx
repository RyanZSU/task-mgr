import { useRef, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import type { Attachment, Task } from '../../types'
import { useTaskStore } from '../../stores/useTaskStore'
import { useProjectStore } from '../../stores/useProjectStore'
import { useTagStore } from '../../stores/useTagStore'
import { useUiStore } from '../../stores/useUiStore'
import { TimeInput } from '../../components/TimeInput'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { formatDuration, parseDuration } from '../../lib/format'
import { SubtaskList } from './SubtaskList'
import { RepeatEditor } from '../repeat/RepeatEditor'

function readFileAsDataUrl(file: File): Promise<Omit<Attachment, 'id'>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        dataUrl: String(reader.result),
        size: file.size,
      })
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

interface FormProps {
  editing?: Task
  initialProjectId?: string
  parentId?: string
  onClose: () => void
}

function TaskForm({ editing, initialProjectId, parentId, onClose }: FormProps) {
  const addTask = useTaskStore((s) => s.addTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const addTimeSpent = useTaskStore((s) => s.addTimeSpent)
  const addAttachment = useTaskStore((s) => s.addAttachment)
  const deleteAttachment = useTaskStore((s) => s.deleteAttachment)
  const attachments = useTaskStore((s) => s.attachments)
  const projects = useProjectStore((s) => s.projects)
  const tags = useTagStore((s) => s.tags)

  const [title, setTitle] = useState(editing?.title ?? '')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [projectId, setProjectId] = useState(editing?.projectId ?? initialProjectId ?? '')
  const [tagIds, setTagIds] = useState<string[]>(editing?.tagIds ?? [])
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? '')
  const [timeEstimateMs, setTimeEstimateMs] = useState<number | undefined>(editing?.timeEstimateMs)
  const [repeatCfgId, setRepeatCfgId] = useState<string | undefined>(editing?.repeatCfgId)
  const [newAttachments, setNewAttachments] = useState<Omit<Attachment, 'id'>[]>([])
  const [manualMs, setManualMs] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const existingAttachments = attachments.filter((a) => editing?.attachmentIds.includes(a.id))

  function save() {
    const t = title.trim()
    if (!t) return
    const attachmentIds = [...(editing?.attachmentIds ?? [])]
    for (const a of newAttachments) {
      const created = addAttachment(a)
      attachmentIds.push(created.id)
    }
    const patch = {
      title: t,
      notes: notes || undefined,
      projectId: projectId || undefined,
      tagIds,
      dueDate: dueDate || undefined,
      timeEstimateMs,
      repeatCfgId,
      attachmentIds,
    }
    if (editing) {
      updateTask(editing.id, patch)
    } else {
      addTask({ ...patch, parentId })
    }
    onClose()
  }

  function applyManual(ms: number) {
    if (!editing) return
    addTimeSpent(editing.id, ms)
    setManualMs('')
  }

  async function onFiles(files: FileList | null) {
    if (!files) return
    const read: Omit<Attachment, 'id'>[] = []
    for (const f of Array.from(files)) {
      // Guard against blowing the LocalStorage quota (~5 MB).
      if (f.size > 1_000_000) {
        window.alert('Attachment is too large (max ~1 MB). Consider linking a file instead.')
        continue
      }
      read.push(await readFileAsDataUrl(f))
    }
    setNewAttachments((prev) => [...prev, ...read])
  }

  const manualParsed = parseDuration(manualMs)

  return (
    <>
      <DialogTitle>{editing ? 'Edit task' : 'New task'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ minWidth: 420, maxWidth: 560 }}>
          <TextField
            autoFocus
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                save()
              }
            }}
          />
          <TextField label="Notes" multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

          <Stack direction="row" spacing={1}>
            <Select size="small" fullWidth displayEmpty value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <MenuItem value="">
                <em>No project</em>
              </MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.title}
                </MenuItem>
              ))}
            </Select>
            <Select
              size="small"
              fullWidth
              multiple
              displayEmpty
              value={tagIds}
              onChange={(e) => setTagIds(e.target.value as string[])}
              renderValue={(sel) =>
                sel.length === 0 ? (
                  <em>Tags</em>
                ) : (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {tags.filter((t) => sel.includes(t.id)).map((t) => (
                      <Chip key={t.id} size="small" label={t.title} sx={{ bgcolor: t.color }} />
                    ))}
                  </Box>
                )
              }
            >
              {tags.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.title}
                </MenuItem>
              ))}
            </Select>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <TextField
              size="small"
              type="date"
              label="Due date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <Box sx={{ flex: 1 }}>
              <TimeInput label="Time estimate (optional)" value={timeEstimateMs} onChange={setTimeEstimateMs} />
            </Box>
          </Stack>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Repeat
            </Typography>
            <RepeatEditor repeatCfgId={repeatCfgId} onChange={setRepeatCfgId} />
          </Box>

          {editing && (
            <>
              <Divider />
              <SubtaskList parentId={editing.id} />
              <Divider />
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Time tracking
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Tracked: {formatDuration(editing.timeSpentMs)}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="e.g. 15m"
                    value={manualMs}
                    onChange={(e) => setManualMs(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && manualParsed != null) applyManual(manualParsed)
                    }}
                    sx={{ width: 120 }}
                  />
                  <IconButton size="small" disabled={manualParsed == null} onClick={() => manualParsed != null && applyManual(manualParsed)} title="Add time">
                    <AddIcon fontSize="inherit" />
                  </IconButton>
                  <IconButton size="small" disabled={manualParsed == null} onClick={() => manualParsed != null && applyManual(-manualParsed)} title="Subtract time">
                    <RemoveIcon fontSize="inherit" />
                  </IconButton>
                </Stack>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Attachments
                </Typography>
                {existingAttachments.map((a) => (
                  <Stack key={a.id} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.name}
                    </Typography>
                    <IconButton size="small" onClick={() => deleteAttachment(a.id)}>
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </Stack>
                ))}
                {newAttachments.map((a, i) => (
                  <Stack key={i} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.name}
                    </Typography>
                    <IconButton size="small" onClick={() => setNewAttachments((prev) => prev.filter((_, j) => j !== i))}>
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </Stack>
                ))}
                <Button size="small" startIcon={<AttachFileIcon />} onClick={() => fileRef.current?.click()}>
                  Attach file
                </Button>
                <input ref={fileRef} type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        {editing && (
          <IconButton color="error" onClick={() => setConfirmDelete(true)} sx={{ mr: 'auto' }}>
            <DeleteIcon />
          </IconButton>
        )}
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!title.trim()} onClick={save}>
          Save
        </Button>
      </DialogActions>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete task?"
        message="This task and all of its subtasks will be permanently removed."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (editing) deleteTask(editing.id)
          onClose()
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  )
}

export function TaskDialog() {
  const ctx = useUiStore((s) => s.taskDialog)
  const closeTaskDialog = useUiStore((s) => s.closeTaskDialog)
  const tasks = useTaskStore((s) => s.tasks)
  const editing = ctx?.taskId ? tasks.find((t) => t.id === ctx.taskId) : undefined

  return (
    <Dialog open={ctx != null} onClose={closeTaskDialog} maxWidth="sm" fullWidth>
      {ctx && (
        <TaskForm
          key={editing?.id ?? 'new'}
          editing={editing}
          initialProjectId={ctx.projectId}
          parentId={ctx.parentId}
          onClose={closeTaskDialog}
        />
      )}
    </Dialog>
  )
}