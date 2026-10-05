import { useState } from 'react'
import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import ArchiveIcon from '@mui/icons-material/UnarchiveOutlined'
import UnarchiveIcon from '@mui/icons-material/ArchiveOutlined'
import CheckIcon from '@mui/icons-material/Check'
import { useProjectStore } from '../../stores/useProjectStore'
import { useTaskStore } from '../../stores/useTaskStore'
import { ColorPicker } from '../../components/ColorPicker'
import type { Project } from '../../types'

export function ProjectManager() {
  const projects = useProjectStore((s) => s.projects)
  const addProject = useProjectStore((s) => s.addProject)
  const updateProject = useProjectStore((s) => s.updateProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const tasks = useTaskStore((s) => s.tasks)

  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  function taskCount(projectId: string) {
    return tasks.filter((t) => t.projectId === projectId).length
  }

  function add() {
    const t = newTitle.trim()
    if (!t) return
    addProject({ title: t })
    setNewTitle('')
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
        <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#3f51b5', flexShrink: 0, border: '1px solid rgba(0,0,0,0.2)' }} />
        <TextField size="small" fullWidth placeholder="New project name" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <Button variant="contained" size="small" onClick={add} startIcon={<AddIcon />} disabled={!newTitle.trim()}>
          Add
        </Button>
      </Stack>

      {projects.map((p) => (
        <ProjectRow
          key={p.id}
          project={p}
          count={taskCount(p.id)}
          editing={editingId === p.id}
          onEdit={() => setEditingId(p.id)}
          onDone={() => setEditingId(null)}
          onDelete={() => deleteProject(p.id)}
          onUpdate={(patch) => updateProject(p.id, patch)}
        />
      ))}
      {projects.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No projects yet. Add one above to group your tasks.
        </Typography>
      )}
    </Box>
  )
}

interface RowProps {
  project: Project
  count: number
  editing: boolean
  onEdit: () => void
  onDone: () => void
  onDelete: () => void
  onUpdate: (patch: Partial<Project>) => void
}

function ProjectRow({ project, count, editing, onEdit, onDone, onDelete, onUpdate }: RowProps) {
  const [title, setTitle] = useState(project.title)
  const [color, setColor] = useState(project.color)
  const [note, setNote] = useState(project.note ?? '')

  const dotColor = editing ? color : project.color

  if (editing) {
    return (
      <Box sx={{ p: 1, mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
          <TextField size="small" label="Name" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <Button
            size="small"
            variant="contained"
            startIcon={<CheckIcon />}
            disabled={!title.trim()}
            onClick={() => {
              onUpdate({ title: title.trim(), color, note: note || undefined })
              onDone()
            }}
          >
            Save
          </Button>
        </Stack>
        <ColorPicker value={color} onChange={setColor} />
        <TextField size="small" fullWidth label="Note" value={note} onChange={(e) => setNote(e.target.value)} sx={{ mt: 1 }} />
      </Box>
    )
  }

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', py: 0.5, px: 0.5, borderRadius: 1, '&:hover .row-actions': { opacity: 1 } }}>
      <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: dotColor, flexShrink: 0 }} />
      <Box sx={{ flexGrow: 1, minWidth: 0 }} onClick={onEdit}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              ...(project.isArchived ? { color: 'text.disabled', textDecoration: 'line-through' } : {}),
            }}
          >
            {project.title}
          </Typography>
          {project.note && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {project.note}
            </Typography>
          )}
        </Stack>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {count}
      </Typography>
      <Stack direction="row" className="row-actions" sx={{ opacity: 0 }}>
        <IconButton size="small" onClick={() => onUpdate({ isArchived: !project.isArchived })} title={project.isArchived ? 'Unarchive' : 'Archive'}>
          {project.isArchived ? <UnarchiveIcon fontSize="inherit" /> : <ArchiveIcon fontSize="inherit" />}
        </IconButton>
        <IconButton size="small" onClick={onEdit} title="Edit">
          <EditIcon fontSize="inherit" />
        </IconButton>
        <IconButton size="small" color="error" onClick={onDelete} title="Delete">
          <DeleteIcon fontSize="inherit" />
        </IconButton>
      </Stack>
    </Stack>
  )
}