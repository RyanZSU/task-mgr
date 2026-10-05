import { Box, Checkbox, Chip, IconButton, Stack, Typography } from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import EditIcon from '@mui/icons-material/Edit'
import { formatDurationShort } from '../../lib/format'
import { contrastText, getSubtasks } from '../../lib/tasks'
import { formatDayLabel, todayKey } from '../../lib/dates'
import { useTaskStore } from '../../stores/useTaskStore'
import { useProjectStore } from '../../stores/useProjectStore'
import { useTagStore } from '../../stores/useTagStore'
import { useTimerStore } from '../../stores/useTimerStore'
import { useUiStore } from '../../stores/useUiStore'
import type { Task } from '../../types'

interface Props {
  task: Task
  showSubtaskInfo?: boolean
  dense?: boolean
}

export function TaskCard({ task, showSubtaskInfo = true, dense = false }: Props) {
  const tasks = useTaskStore((s) => s.tasks)
  const toggleTask = useTaskStore((s) => s.toggleTask)
  const projects = useProjectStore((s) => s.projects)
  const tags = useTagStore((s) => s.tags)
  const openTaskDialog = useUiStore((s) => s.openTaskDialog)
  const stopwatch = useTimerStore((s) => s.stopwatch)
  const startStopwatch = useTimerStore((s) => s.startStopwatch)
  const stopStopwatch = useTimerStore((s) => s.stopStopwatch)

  const project = projects.find((p) => p.id === task.projectId)
  const taskTags = tags.filter((t) => task.tagIds.includes(t.id))
  const subtasks = showSubtaskInfo ? getSubtasks(tasks, task.id) : []
  const doneSubtasks = subtasks.filter((s) => s.isDone).length
  const isRunning = stopwatch.taskId === task.id && stopwatch.startedAt != null

  const overdue = task.dueDate && !task.isDone && task.dueDate < todayKey()

  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{
        alignItems: 'flex-start',
        py: dense ? 0.4 : 0.75,
        px: 0.5,
        borderRadius: 1,
        '&:hover .task-actions': { opacity: 1 },
        ...(isRunning ? { bgcolor: 'primary.light', color: 'primary.contrastText' } : {}),
      }}
    >
      <Checkbox
        size="small"
        checked={task.isDone}
        onChange={() => toggleTask(task.id)}
        sx={{ mt: dense ? 0.2 : 0.1, ...(isRunning ? { color: 'primary.contrastText' } : {}) }}
      />
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ cursor: 'pointer', alignItems: 'center' }}
          onClick={() => openTaskDialog({ taskId: task.id })}
        >
          <Typography
            variant="body2"
            sx={{
              textDecoration: task.isDone ? 'line-through' : 'none',
              color: task.isDone ? 'text.secondary' : 'text.primary',
              fontWeight: isRunning ? 600 : 400,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {task.title}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ mt: 0.3, alignItems: 'center', flexWrap: 'wrap' }}>
          {project && (
            <Chip
              size="small"
              label={project.title}
              sx={{
                height: 18,
                fontSize: 11,
                bgcolor: project.color,
                color: contrastText(project.color),
              }}
            />
          )}
          {taskTags.map((t) => (
            <Chip
              key={t.id}
              size="small"
              label={t.title}
              sx={{ height: 18, fontSize: 11, bgcolor: t.color, color: contrastText(t.color) }}
            />
          ))}
          {task.timeEstimateMs != null && task.timeEstimateMs > 0 && (
            <Typography variant="caption" color="text.secondary">
              est {formatDurationShort(task.timeEstimateMs)}
            </Typography>
          )}
          {task.timeSpentMs > 0 && (
            <Typography variant="caption" color="text.secondary" data-testid="time-spent">
              · {formatDurationShort(task.timeSpentMs)}
            </Typography>
          )}
          {showSubtaskInfo && subtasks.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              · {doneSubtasks}/{subtasks.length} subtasks
            </Typography>
          )}
          {task.dueDate && (
            <Typography variant="caption" sx={{ color: overdue ? 'error.main' : 'text.secondary', ml: 0.5 }}>
              {overdue ? 'Overdue · ' : 'Due '}
              {formatDayLabel(task.dueDate)}
            </Typography>
          )}
        </Stack>
      </Box>
      <Stack direction="row" spacing={-0.5} className="task-actions" sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
        {isRunning ? (
          <IconButton size="small" onClick={() => stopStopwatch()} title="Stop tracking">
            <StopIcon fontSize="inherit" />
          </IconButton>
        ) : (
          <IconButton size="small" onClick={() => startStopwatch(task.id)} title="Start tracking">
            <PlayArrowIcon fontSize="inherit" />
          </IconButton>
        )}
        <IconButton size="small" onClick={() => openTaskDialog({ taskId: task.id })} title="Edit">
          <EditIcon fontSize="inherit" />
        </IconButton>
      </Stack>
    </Stack>
  )
}