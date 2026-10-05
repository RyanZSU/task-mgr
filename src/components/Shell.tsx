import { useState } from 'react'
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import TodayIcon from '@mui/icons-material/Today'
import ChecklistIcon from '@mui/icons-material/Checklist'
import ViewKanbanIcon from '@mui/icons-material/ViewKanban'
import ScheduleIcon from '@mui/icons-material/Schedule'
import BarChartIcon from '@mui/icons-material/BarChart'
import TimerIcon from '@mui/icons-material/Timer'
import FolderIcon from '@mui/icons-material/Folder'
import SettingsIcon from '@mui/icons-material/Settings'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useUiStore } from '../stores/useUiStore'
import { useTimerStore } from '../stores/useTimerStore'
import { useTaskStore } from '../stores/useTaskStore'
import { TaskDialog } from '../features/tasks/TaskDialog'
import { useGlobalShortcuts } from '../lib/shortcuts'

const NAV = [
  { label: 'Planner', to: '/day/today', icon: <TodayIcon /> },
  { label: 'Tasks', to: '/tasks', icon: <ChecklistIcon /> },
  { label: 'Board', to: '/board', icon: <ViewKanbanIcon /> },
  { label: 'Worklog', to: '/timeline', icon: <ScheduleIcon /> },
  { label: 'Metrics', to: '/metrics', icon: <BarChartIcon /> },
  { label: 'Focus', to: '/focus', icon: <TimerIcon /> },
  { label: 'Projects & Tags', to: '/manage', icon: <FolderIcon /> },
  { label: 'Settings', to: '/settings', icon: <SettingsIcon /> },
]

const DRAWER_WIDTH = 232

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  return (
    <List sx={{ pt: 0 }}>
      {NAV.map((item) => {
        const isActive =
          location.pathname === item.to || (item.to === '/day/today' && location.pathname.startsWith('/day'))
        return (
          <ListItemButton
            key={item.to}
            component={Link}
            to={item.to}
            selected={isActive}
            onClick={onNavigate}
            sx={{ borderRadius: 1, mx: 1, mb: 0.25 }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: isActive ? 'primary.main' : 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.label}
              slotProps={{ primary: { sx: { fontSize: 14, fontWeight: isActive ? 600 : 400 } } }}
            />
          </ListItemButton>
        )
      })}
    </List>
  )
}

function SearchBar() {
  const query = useUiStore((s) => s.searchQuery)
  const setQuery = useUiStore((s) => s.setSearchQuery)
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <TextField
      size="small"
      placeholder="Search tasks…"
      value={query}
      onChange={(e) => {
        setQuery(e.target.value)
        if (!location.pathname.startsWith('/tasks')) navigate('/tasks')
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
      sx={{ bgcolor: 'action.hover', borderRadius: 1, width: { xs: 140, sm: 240 } }}
    />
  )
}

export function Shell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const openTaskDialog = useUiStore((s) => s.openTaskDialog)
  const stopwatch = useTimerStore((s) => s.stopwatch)
  const tasks = useTaskStore((s) => s.tasks)

  useGlobalShortcuts()

  const runningTask = stopwatch.taskId ? tasks.find((t) => t.id === stopwatch.taskId) : undefined

  const renderNav = (onNavigate?: () => void) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
          Task Manager
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Offline · LocalStorage
        </Typography>
      </Box>
      <Button variant="contained" sx={{ mx: 2, mb: 1 }} startIcon={<AddIcon />} onClick={() => openTaskDialog()}>
        New task
      </Button>
      <NavList onNavigate={onNavigate} />
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' }, mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <SearchBar />
          <Box sx={{ flexGrow: 1 }} />
          {runningTask && (
            <Tooltip title="Stopwatch running">
              <Typography variant="caption" color="primary" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
                ● {runningTask.title}
              </Typography>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        {renderNav()}
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {renderNav(() => setMobileOpen(false))}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, overflowY: 'auto', minWidth: 0 }}>
        <Toolbar />
        <Box sx={{ pt: 2, height: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Box>
      </Box>

      <TaskDialog />
    </Box>
  )
}