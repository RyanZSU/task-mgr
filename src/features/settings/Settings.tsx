import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import UploadIcon from '@mui/icons-material/Upload'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { applyImport, clearAllData, downloadExport, validateImport } from '../../lib/persistence'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { SHORTCUTS } from '../../lib/shortcuts'
import type { ExportData } from '../../types'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  )
}

export function Settings() {
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const updatePomodoro = useSettingsStore((s) => s.updatePomodoro)
  const fileRef = useRef<HTMLInputElement>(null)

  const [pendingImport, setPendingImport] = useState<ExportData | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  async function onFile(file: File) {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const problems = validateImport(data)
      if (problems.length) {
        setImportError(problems.join(' '))
        return
      }
      setImportError(null)
      setPendingImport(data as ExportData)
    } catch {
      setImportError('Could not read that file — is it valid JSON?')
    }
  }

  function doImport(mode: 'merge' | 'replace') {
    if (!pendingImport) return
    applyImport(pendingImport, mode)
    setPendingImport(null)
    setToast(mode === 'replace' ? 'Data imported (replaced).' : 'Data imported (merged).')
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, pb: 6 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Settings
      </Typography>

      <Section title="Appearance">
        <Select size="small" value={settings.theme} onChange={(e) => updateSettings({ theme: e.target.value as typeof settings.theme })}>
          <MenuItem value="system">System</MenuItem>
          <MenuItem value="light">Light</MenuItem>
          <MenuItem value="dark">Dark</MenuItem>
        </Select>
      </Section>

      <Section title="Pomodoro">
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <TextField
            size="small"
            label="Work (min)"
            type="number"
            value={settings.pomodoro.workMin}
            onChange={(e) => updatePomodoro({ workMin: Math.max(1, parseInt(e.target.value, 10) || 25) })}
          />
          <TextField
            size="small"
            label="Break (min)"
            type="number"
            value={settings.pomodoro.breakMin}
            onChange={(e) => updatePomodoro({ breakMin: Math.max(1, parseInt(e.target.value, 10) || 5) })}
          />
          <TextField
            size="small"
            label="Long break (min)"
            type="number"
            value={settings.pomodoro.longBreakMin}
            onChange={(e) => updatePomodoro({ longBreakMin: Math.max(1, parseInt(e.target.value, 10) || 15) })}
          />
          <TextField
            size="small"
            label="Long break every"
            type="number"
            value={settings.pomodoro.longBreakInterval}
            onChange={(e) => updatePomodoro({ longBreakInterval: Math.max(1, parseInt(e.target.value, 10) || 4) })}
          />
        </Stack>
        <FormControlLabel
          control={
            <Switch checked={settings.pomodoro.isManualContinue} onChange={(e) => updatePomodoro({ isManualContinue: e.target.checked })} />
          }
          label="Manually start breaks after focus sessions"
          sx={{ mt: 1 }}
        />
      </Section>

      <Section title="Time tracking">
        <FormControlLabel
          control={<Switch checked={settings.isTrackIdleTime} onChange={(e) => updateSettings({ isTrackIdleTime: e.target.checked })} />}
          label="Pause the stopwatch when I'm idle"
        />
        <TextField
          size="small"
          label="Idle threshold"
          type="number"
          value={Math.round(settings.minIdleTimeMs / 60000)}
          onChange={(e) => updateSettings({ minIdleTimeMs: Math.max(1, parseInt(e.target.value, 10) || 3) * 60000 })}
          helperText="minutes of inactivity before pausing"
          sx={{ display: 'block', mt: 1.5, maxWidth: 180 }}
        />
      </Section>

      <Section title="Notifications">
        <FormControlLabel
          control={<Switch checked={settings.isNotifyOnBreakDone} onChange={(e) => updateSettings({ isNotifyOnBreakDone: e.target.checked })} />}
          label="Play a sound when a timer ends"
        />
      </Section>

      <Section title="Data">
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadExport}>
            Export backup
          </Button>
          <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => fileRef.current?.click()}>
            Import
          </Button>
          <Button variant="outlined" color="error" startIcon={<DeleteForeverIcon />} onClick={() => setConfirmClear(true)}>
            Clear all data
          </Button>
        </Stack>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
            e.target.value = ''
          }}
        />
        {importError && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {importError}
          </Typography>
        )}
        {pendingImport && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1.5 }}>
            <Typography variant="body2">Ready to import. How should existing data be handled?</Typography>
            <Button size="small" variant="contained" onClick={() => doImport('merge')}>
              Merge
            </Button>
            <Button size="small" color="error" onClick={() => doImport('replace')}>
              Replace
            </Button>
            <Button size="small" onClick={() => setPendingImport(null)}>
              Cancel
            </Button>
          </Stack>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Everything is stored locally in your browser (LocalStorage) and works offline. Use Export to back up, and
          Import to restore or move between browsers/devices.
        </Typography>
      </Section>

      <Section title="Keyboard shortcuts">
        {SHORTCUTS.map((s) => (
          <Stack key={s.keys} direction="row" spacing={1} sx={{ py: 0.4 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', minWidth: 28 }}>
              {s.keys}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {s.description}
            </Typography>
          </Stack>
        ))}
      </Section>

      <Section title="Storage">
        <Typography variant="body2" color="text.secondary">
          In use: ~{formatBytes(usedBytes())}. LocalStorage allows about 5 MB. Attachments are capped at ~1 MB each to
          stay within that limit.
        </Typography>
      </Section>

      <ConfirmDialog
        open={confirmClear}
        title="Clear all data?"
        message="This permanently deletes every task, project, tag and time entry. Consider exporting a backup first."
        confirmLabel="Clear"
        danger
        onConfirm={() => {
          clearAllData()
          setToast('All data cleared.')
        }}
        onClose={() => setConfirmClear(false)}
      />

      <Snackbar open={toast != null} autoHideDuration={3000} onClose={() => setToast(null)} message={toast ?? ''} />
    </Box>
  )
}

function usedBytes(): number {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('sp:')) total += (localStorage.getItem(key)?.length ?? 0) * 2
  }
  return total
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}