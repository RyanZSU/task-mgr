import { useMemo, useState } from 'react'
import { Box, Button, Chip, MenuItem, Paper, Select, Stack, Tab, Tabs, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useTaskStore } from '../../stores/useTaskStore'
import { useProjectStore } from '../../stores/useProjectStore'
import { useTagStore } from '../../stores/useTagStore'
import { useUiStore } from '../../stores/useUiStore'
import { matchesSearch, sortByOrder } from '../../lib/tasks'
import { TaskCard } from '../tasks/TaskCard'
import type { Task } from '../../types'

type StatusFilter = 'open' | 'done' | 'all'

export function TaskList() {
  const tasks = useTaskStore((s) => s.tasks)
  const projects = useProjectStore((s) => s.projects)
  const tags = useTagStore((s) => s.tags)
  const searchQuery = useUiStore((s) => s.searchQuery)
  const openTaskDialog = useUiStore((s) => s.openTaskDialog)

  const [status, setStatus] = useState<StatusFilter>('open')
  const [projectFilter, setProjectFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')

  const filtered = useMemo(() => {
    const roots = tasks.filter((t) => !t.parentId)
    return sortByOrder(roots).filter((t) => {
      if (status === 'open' && t.isDone) return false
      if (status === 'done' && !t.isDone) return false
      if (projectFilter && t.projectId !== projectFilter) return false
      if (tagFilter && !t.tagIds.includes(tagFilter)) return false
      if (!matchesSearch(t, searchQuery)) return false
      return true
    })
  }, [tasks, status, projectFilter, tagFilter, searchQuery])

  const groups = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of filtered) {
      const key = t.projectId ?? '__none__'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return [...map.entries()].map(([key, list]) => ({
      key,
      project: projects.find((p) => p.id === key),
      list,
    }))
  }, [filtered, projects])

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, pb: 6 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
        <Tabs value={status} onChange={(_, v) => setStatus(v as StatusFilter)} sx={{ minHeight: 0 }}>
          <Tab label="Open" value="open" sx={{ minHeight: 0, py: 0.5 }} />
          <Tab label="Done" value="done" sx={{ minHeight: 0, py: 0.5 }} />
          <Tab label="All" value="all" sx={{ minHeight: 0, py: 0.5 }} />
        </Tabs>
        <Select size="small" displayEmpty value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} sx={{ ml: 'auto' }}>
          <MenuItem value="">All projects</MenuItem>
          {projects.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.title}
            </MenuItem>
          ))}
        </Select>
        <Select size="small" displayEmpty value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <MenuItem value="">All tags</MenuItem>
          {tags.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.title}
            </MenuItem>
          ))}
        </Select>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openTaskDialog()}>
          New
        </Button>
      </Stack>

      {filtered.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
          No tasks match. {searchQuery && `Nothing found for “${searchQuery}”.`}
        </Typography>
      )}

      {groups.map((g) => (
        <Box key={g.key} sx={{ mb: 2 }}>
          {g.project && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: g.project.color }} />
              <Typography variant="overline" color="text.secondary">
                {g.project.title}
              </Typography>
            </Stack>
          )}
          {g.list.map((t) => (
            <Paper key={t.id} variant="outlined" sx={{ mb: 0.5, px: 0.5 }}>
              <TaskCard task={t} />
            </Paper>
          ))}
        </Box>
      ))}

      {groups.length === 0 && searchQuery && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Chip label="Clear search" onClick={() => useUiStore.setState({ searchQuery: '' })} />
        </Box>
      )}
    </Box>
  )
}