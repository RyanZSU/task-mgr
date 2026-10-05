import { useState } from 'react'
import { Box, IconButton, InputAdornment, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useTaskStore } from '../../stores/useTaskStore'
import { getSubtasks } from '../../lib/tasks'
import { TaskCard } from './TaskCard'

interface Props {
  parentId: string
}

export function SubtaskList({ parentId }: Props) {
  const tasks = useTaskStore((s) => s.tasks)
  const addTask = useTaskStore((s) => s.addTask)
  const [title, setTitle] = useState('')

  const parent = tasks.find((t) => t.id === parentId)
  const subtasks = getSubtasks(tasks, parentId)

  function add() {
    const t = title.trim()
    if (!t) return
    addTask({
      title: t,
      parentId,
      projectId: parent?.projectId,
      tagIds: parent?.tagIds ?? [],
      isDone: false,
      timeSpentMs: 0,
    })
    setTitle('')
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Subtasks
      </Typography>
      {subtasks.map((s) => (
        <TaskCard key={s.id} task={s} showSubtaskInfo={false} dense />
      ))}
      <TextField
        fullWidth
        size="small"
        placeholder="Add subtask"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && add()}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={add} disabled={!title.trim()}>
                  <AddIcon fontSize="inherit" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  )
}