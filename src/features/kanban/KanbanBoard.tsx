import { useMemo } from 'react'
import { Box, IconButton, Paper, Stack, Typography } from '@mui/material'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import AddIcon from '@mui/icons-material/Add'
import { DndContext, PointerSensor, closestCorners, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTaskStore } from '../../stores/useTaskStore'
import { useProjectStore } from '../../stores/useProjectStore'
import { useUiStore } from '../../stores/useUiStore'
import { sortByOrder } from '../../lib/tasks'
import { TaskCard } from '../tasks/TaskCard'
import type { Task } from '../../types'

interface ColumnDef {
  id: string
  title: string
  color: string
}

function columnOf(task: Task): string {
  if (task.isDone) return 'done'
  return task.projectId ? `project:${task.projectId}` : 'backlog'
}

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', pr: 0.5 }}>
        <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: 'grab', touchAction: 'none' }}>
          <DragIndicatorIcon fontSize="inherit" />
        </IconButton>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <TaskCard task={task} />
        </Box>
      </Stack>
    </div>
  )
}

interface ColumnProps {
  col: ColumnDef
  tasks: Task[]
}

function Column({ col, tasks }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })
  const openTaskDialog = useUiStore((s) => s.openTaskDialog)
  const ids = tasks.map((t) => t.id)

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      sx={{
        width: 288,
        flexShrink: 0,
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: (theme) => theme.palette.background.default,
        ...(isOver ? { outline: '2px solid', outlineColor: 'primary.main' } : {}),
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: col.color }} />
        <Typography variant="subtitle2" sx={{ flexGrow: 1, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 12 }}>
          {col.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {tasks.length}
        </Typography>
        <IconButton
          size="small"
          onClick={() => openTaskDialog({ projectId: col.id.startsWith('project:') ? col.id.slice('project:'.length) : undefined })}
        >
          <AddIcon fontSize="inherit" />
        </IconButton>
      </Stack>
      <Box sx={{ p: 1, flexGrow: 1, overflowY: 'auto' }}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => (
            <SortableTaskCard key={t.id} task={t} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <Typography variant="caption" color="text.disabled" sx={{ px: 1 }}>
            Drop tasks here
          </Typography>
        )}
      </Box>
    </Paper>
  )
}

export function KanbanBoard() {
  const tasks = useTaskStore((s) => s.tasks)
  const projects = useProjectStore((s) => s.projects)
  const updateTask = useTaskStore((s) => s.updateTask)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const activeProjects = projects.filter((p) => !p.isArchived && !p.isHidden)
  const roots = useMemo(() => tasks.filter((t) => !t.parentId), [tasks])

  const columns = useMemo<ColumnDef[]>(() => {
    return [
      { id: 'backlog', title: 'Backlog', color: '#9e9e9e' },
      ...activeProjects.map((p) => ({ id: `project:${p.id}`, title: p.title, color: p.color })),
      { id: 'done', title: 'Done', color: '#43a047' },
    ]
  }, [activeProjects])

  const colTasks = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const c of columns) map.set(c.id, [])
    for (const t of roots) {
      const key = columnOf(t)
      if (map.has(key)) map.get(key)!.push(t)
    }
    for (const [k, list] of map) map.set(k, sortByOrder(list))
    return map
  }, [roots, columns])

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over) return
    const activeId = String(active.id)
    const task = tasks.find((t) => t.id === activeId)
    if (!task) return
    const fromCol = columnOf(task)

    const overIsColumn = columns.some((c) => c.id === over.id)
    const overTask = overIsColumn ? undefined : tasks.find((t) => t.id === over.id)
    const overColId = overIsColumn ? String(over.id) : overTask ? columnOf(overTask) : null
    if (!overColId) return

    if (fromCol === overColId) {
      const ids = sortByOrder(roots.filter((t) => columnOf(t) === fromCol)).map((t) => t.id)
      const oldIndex = ids.indexOf(activeId)
      const overIndex = overTask ? ids.indexOf(overTask.id) : ids.length - 1
      if (oldIndex < 0 || overIndex < 0) return
      const newIds = arrayMove(ids, oldIndex, overIndex)
      newIds.forEach((id, i) => updateTask(id, { order: i }))
      return
    }

    // Cross-column move.
    const patch: Partial<Task> =
      overColId === 'done'
        ? { isDone: true }
        : { isDone: false, projectId: overColId === 'backlog' ? undefined : overColId.slice('project:'.length) }
    updateTask(activeId, patch)

    const fresh = useTaskStore.getState().tasks.filter((t) => !t.parentId)
    const destIds = sortByOrder(fresh.filter((t) => columnOf(t) === overColId)).map((t) => t.id)
    let insertIndex = destIds.length
    if (overTask && !overIsColumn) {
      const idx = destIds.indexOf(overTask.id)
      if (idx >= 0) insertIndex = idx
    }
    const destWithout = destIds.filter((id) => id !== activeId)
    const newIds = [...destWithout.slice(0, insertIndex), activeId, ...destWithout.slice(insertIndex)]
    newIds.forEach((id, i) => updateTask(id, { order: i }))
  }

  return (
    <Box sx={{ height: '100%', overflowX: 'auto' }}>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <Stack direction="row" spacing={1.5} sx={{ px: 2, pb: 2, height: '100%', alignItems: 'stretch' }}>
          {columns.map((c) => (
            <Column key={c.id} col={c} tasks={colTasks.get(c.id) ?? []} />
          ))}
        </Stack>
      </DndContext>
    </Box>
  )
}