import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Box, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { format } from 'date-fns'
import { useWorklogStore } from '../../stores/useWorklogStore'
import { useTaskStore } from '../../stores/useTaskStore'
import { useProjectStore } from '../../stores/useProjectStore'
import { useTimerStore } from '../../stores/useTimerStore'
import { addDaysToKey, dayKey, fromDayKey, todayKey } from '../../lib/dates'
import { formatDuration } from '../../lib/format'

export function Metrics() {
  const entries = useWorklogStore((s) => s.entries)
  const tasks = useTaskStore((s) => s.tasks)
  const projects = useProjectStore((s) => s.projects)
  const distractionLog = useTimerStore((s) => s.distraction.logByDay)

  const [range, setRange] = useState<7 | 30>(7)

  const days = useMemo(
    () => Array.from({ length: range }, (_, i) => addDaysToKey(todayKey(), i - (range - 1))),
    [range],
  )

  const daily = useMemo(
    () =>
      days.map((key) => {
        const timeMs = entries.filter((e) => e.date === key).reduce((s, e) => s + e.timeSpentMs, 0)
        const completed = tasks.filter((t) => t.completedAt && dayKey(new Date(t.completedAt)) === key).length
        return {
          label: format(fromDayKey(key), 'MMM d'),
          time: Math.round(timeMs / 60000) / 10, // hours with 1 decimal
          completed,
        }
      }),
    [days, entries, tasks],
  )

  const byProject = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of entries) {
      const key = e.projectId ?? '__none__'
      map.set(key, (map.get(key) ?? 0) + e.timeSpentMs)
    }
    return [...map.entries()]
      .map(([id, ms]) => {
        const p = projects.find((x) => x.id === id)
        return { name: p?.title ?? 'No project', value: Math.round(ms / 60000), color: p?.color ?? '#9e9e9e' }
      })
      .sort((a, b) => b.value - a.value)
  }, [entries, projects])

  const totalMs = entries.reduce((s, e) => s + e.timeSpentMs, 0)
  const done = tasks.filter((t) => !t.parentId && t.isDone).length
  const open = tasks.filter((t) => !t.parentId && !t.isDone).length
  const distractedToday = distractionLog[todayKey()] ?? 0

  const statTiles = [
    { label: 'Tracked today', value: formatDuration(entries.filter((e) => e.date === todayKey()).reduce((s, e) => s + e.timeSpentMs, 0)) },
    { label: `Tracked (${range}d)`, value: formatDuration(totalMs) },
    { label: 'Open tasks', value: String(open) },
    { label: 'Done tasks', value: String(done) },
    { label: 'Distractions today', value: String(distractedToday) },
  ]

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, pb: 6 }}>
      <Stack direction="row" sx={{ alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Metrics
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={range}
          onChange={(_, v) => v && setRange(v as 7 | 30)}
        >
          <ToggleButton value={7}>7 days</ToggleButton>
          <ToggleButton value={30}>30 days</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 2 }}>
        {statTiles.map((s) => (
          <Paper key={s.label} sx={{ px: 2, py: 1, minWidth: 150, flexGrow: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {s.label}
            </Typography>
            <Typography variant="h6">{s.value}</Typography>
          </Paper>
        ))}
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Time tracked per day (hours)
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={daily} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip formatter={(v) => `${v}h`} />
            <Bar dataKey="time" fill="#3f51b5" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Tasks completed per day
        </Typography>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={daily} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" fontSize={11} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip />
            <Line type="monotone" dataKey="completed" stroke="#43a047" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Time by project (minutes)
        </Typography>
        {byProject.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No tracked time yet.
          </Typography>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byProject} dataKey="value" nameKey="name" outerRadius={90} label>
                {byProject.map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v} min`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Paper>
    </Box>
  )
}