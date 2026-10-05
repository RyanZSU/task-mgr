import { useState } from 'react'
import { Box, Button, IconButton, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { useRepeatStore } from '../../stores/useRepeatStore'
import { describeRepeat, WEEKDAYS_LABELS } from '../../lib/dates'
import type { RepeatType } from '../../types'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

interface Props {
  repeatCfgId: string | undefined
  onChange: (id: string | undefined) => void
}

export function RepeatEditor({ repeatCfgId, onChange }: Props) {
  const cfgs = useRepeatStore((s) => s.repeatCfgs)
  const addRepeatCfg = useRepeatStore((s) => s.addRepeatCfg)
  const deleteRepeatCfg = useRepeatStore((s) => s.deleteRepeatCfg)

  const [creating, setCreating] = useState(false)
  const [type, setType] = useState<RepeatType>('daily')
  const [interval, setInterval] = useState('1')
  const [weekday, setWeekday] = useState('1')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [month, setMonth] = useState('0')

  const selected = cfgs.find((c) => c.id === repeatCfgId)

  function save() {
    const cfg = addRepeatCfg({
      title: '',
      type,
      interval: Math.max(1, parseInt(interval, 10) || 1),
      weekday: type === 'weekly' ? parseInt(weekday, 10) : undefined,
      dayOfMonth: type === 'monthly' || type === 'yearly' ? Math.max(1, Math.min(31, parseInt(dayOfMonth, 10) || 1)) : undefined,
      month: type === 'yearly' ? parseInt(month, 10) : undefined,
    })
    onChange(cfg.id)
    setCreating(false)
  }

  if (creating) {
    return (
      <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">New repeat</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="body2">Repeat</Typography>
            <Select size="small" value={type} onChange={(e) => setType(e.target.value as RepeatType)}>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
            <TextField
              size="small"
              label="Every"
              type="number"
              value={interval}
              slotProps={{ htmlInput: { min: 1 } }}
              sx={{ width: 90 }}
              onChange={(e) => setInterval(e.target.value)}
            />
            <Typography variant="body2" color="text.secondary">
              {type === 'custom' ? 'days' : type === 'daily' ? 'days' : type === 'weekly' ? 'weeks' : type === 'monthly' ? 'months' : 'years'}
            </Typography>
          </Stack>
          {type === 'weekly' && (
            <Select size="small" value={weekday} onChange={(e) => setWeekday(e.target.value)}>
              {WEEKDAYS_LABELS.map((d, i) => (
                <MenuItem key={d} value={String(i)}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          )}
          {type === 'monthly' && (
            <TextField size="small" label="Day of month" type="number" value={dayOfMonth} slotProps={{ htmlInput: { min: 1, max: 31 } }} onChange={(e) => setDayOfMonth(e.target.value)} />
          )}
          {type === 'yearly' && (
            <Stack direction="row" spacing={1}>
              <Select size="small" value={month} onChange={(e) => setMonth(e.target.value)}>
                {MONTHS.map((m, i) => (
                  <MenuItem key={m} value={String(i)}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
              <TextField size="small" label="Day" type="number" value={dayOfMonth} slotProps={{ htmlInput: { min: 1, max: 31 } }} onChange={(e) => setDayOfMonth(e.target.value)} />
            </Stack>
          )}
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="contained" onClick={save} startIcon={<AddIcon />}>
              Save
            </Button>
            <Button size="small" onClick={() => setCreating(false)} startIcon={<CloseIcon />}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Box>
    )
  }

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Select
        size="small"
        fullWidth
        displayEmpty
        value={repeatCfgId ?? ''}
        onChange={(e) => {
          const v = e.target.value
          if (v === '__new__') {
            setCreating(true)
          } else {
            onChange(v || undefined)
          }
        }}
      >
        <MenuItem value="">No repeat</MenuItem>
        {cfgs.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.title || describeRepeat(c)}
          </MenuItem>
        ))}
        <MenuItem value="__new__">
          <AddIcon fontSize="small" sx={{ mr: 1 }} /> New repeat…
        </MenuItem>
      </Select>
      {selected && (
        <IconButton size="small" color="error" title="Delete repeat" onClick={() => { deleteRepeatCfg(selected.id); onChange(undefined) }}>
          <DeleteIcon fontSize="inherit" />
        </IconButton>
      )}
    </Stack>
  )
}