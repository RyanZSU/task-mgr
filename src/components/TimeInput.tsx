import { useState } from 'react'
import { TextField } from '@mui/material'
import { formatDuration, parseDuration } from '../lib/format'

interface Props {
  label?: string
  value: number | undefined
  onChange: (ms: number | undefined) => void
  placeholder?: string
  fullWidth?: boolean
}

/**
 * Text input for durations. Stores milliseconds, presents a friendly format
 * (e.g. "45m", "2h", "1h 30m"). Accepts "h/m/s" suffixes or plain minutes.
 */
export function TimeInput({ label = 'Time', value, onChange, placeholder, fullWidth }: Props) {
  const [text, setText] = useState(value != null && value > 0 ? formatDuration(value) : '')
  const [error, setError] = useState(false)

  function commit(raw: string) {
    const t = raw.trim()
    if (!t) {
      setError(false)
      onChange(undefined)
      setText('')
      return
    }
    const parsed = parseDuration(t)
    if (parsed == null) {
      setError(true)
      setText(raw)
      return
    }
    setError(false)
    onChange(parsed)
    setText(formatDuration(parsed))
  }

  return (
    <TextField
      label={label}
      value={text}
      size="small"
      error={error}
      helperText={error ? 'Use e.g. "30m", "1h", "1h 30m"' : undefined}
      fullWidth={fullWidth}
      placeholder={placeholder ?? 'e.g. 30m'}
      onFocus={(e) => e.target.select()}
      onChange={(e) => setText(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
      }}
    />
  )
}