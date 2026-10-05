import { useState } from 'react'
import { Box, Button, Chip, Stack, TextField, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import { useTagStore } from '../../stores/useTagStore'
import { useTaskStore } from '../../stores/useTaskStore'
import { ColorPicker } from '../../components/ColorPicker'
import { contrastText } from '../../lib/tasks'
import type { Tag } from '../../types'

export function TagManager() {
  const tags = useTagStore((s) => s.tags)
  const addTag = useTagStore((s) => s.addTag)
  const updateTag = useTagStore((s) => s.updateTag)
  const deleteTag = useTagStore((s) => s.deleteTag)
  const tasks = useTaskStore((s) => s.tasks)

  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  function count(tagId: string) {
    return tasks.filter((t) => t.tagIds.includes(tagId)).length
  }

  function add() {
    const t = newTitle.trim()
    if (!t) return
    addTag({ title: t })
    setNewTitle('')
  }

  return (
    <Box>
      <TextField size="small" fullWidth placeholder="New tag name" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} slotProps={{
        input: {
          endAdornment: (
            <Button size="small" onClick={add} disabled={!newTitle.trim()} startIcon={<AddIcon />}>
              Add
            </Button>
          ),
        },
      }} />

      <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1.5, flexWrap: 'wrap' }}>
        {tags.map((t) =>
          editingId === t.id ? (
            <TagEditor key={t.id} tag={t} onDone={() => setEditingId(null)} onUpdate={(patch) => updateTag(t.id, patch)} />
          ) : (
            <Chip
              key={t.id}
              label={`${t.title} (${count(t.id)})`}
              sx={{ bgcolor: t.color, color: contrastText(t.color) }}
              onClick={() => setEditingId(t.id)}
              onDelete={() => deleteTag(t.id)}
            />
          ),
        )}
      </Stack>
      {tags.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          No tags yet. Tags help you categorize tasks with colors.
        </Typography>
      )}
    </Box>
  )
}

function TagEditor({ tag, onDone, onUpdate }: { tag: Tag; onDone: () => void; onUpdate: (patch: Partial<Tag>) => void }) {
  const [title, setTitle] = useState(tag.title)
  const [color, setColor] = useState(tag.color)

  return (
    <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
      <TextField size="small" label="Name" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <ColorPicker value={color} onChange={setColor} />
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          variant="contained"
          startIcon={<CheckIcon />}
          disabled={!title.trim()}
          onClick={() => {
            onUpdate({ title: title.trim(), color })
            onDone()
          }}
        >
          Save
        </Button>
        <Button size="small" onClick={onDone} startIcon={<EditIcon />}>
          Cancel
        </Button>
      </Stack>
    </Box>
  )
}