/** Format a millisecond duration as a readable string, e.g. "2h 05m" / "45m" / "30s". */
export function formatDuration(ms: number): string {
  if (ms < 0) ms = 0
  const totalSec = Math.round(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

/** Short compact duration, e.g. "2h05m" / "45m" / "30s". */
export function formatDurationShort(ms: number): string {
  if (ms < 0) ms = 0
  const totalSec = Math.round(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m${String(s).padStart(2, '0')}s`
  return `${s}s`
}

/** Clock-style mm:ss (or h:mm:ss) for live timers. */
export function formatClock(ms: number): string {
  if (ms < 0) ms = 0
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Parse a duration string like "1h 30m" or "45" (minutes) into ms. Returns null if unparsable. */
export function parseDuration(input: string): number | null {
  const text = input.trim().toLowerCase()
  if (!text) return null
  let totalMs = 0
  let matched = false
  const re = /(\d+(?:\.\d+)?)\s*(h|m|s)?/g
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    const value = parseFloat(match[1])
    const unit = match[2] ?? 'm'
    if (Number.isNaN(value)) continue
    matched = true
    switch (unit) {
      case 'h':
        totalMs += value * 3600_000
        break
      case 'm':
        totalMs += value * 60_000
        break
      case 's':
        totalMs += value * 1000
        break
    }
  }
  return matched ? Math.round(totalMs) : null
}