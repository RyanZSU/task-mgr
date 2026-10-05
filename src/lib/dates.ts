import { addDays, addWeeks, format, getDate, getDay, getMonth, startOfDay } from 'date-fns'
import type { RepeatCfg } from '../types'

/** Canonical day key: YYYY-MM-DD in local time. */
export function dayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function todayKey(): string {
  return dayKey(new Date())
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function fromDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function addDaysToKey(key: string, days: number): string {
  return dayKey(addDays(startOfDay(fromDayKey(key)), days))
}

/** Human label for a day key, e.g. "Today", "Tomorrow", "Mon, Oct 9". */
export function formatDayLabel(key: string): string {
  const today = todayKey()
  if (key === today) return 'Today'
  if (key === addDaysToKey(today, 1)) return 'Tomorrow'
  if (key === addDaysToKey(today, -1)) return 'Yesterday'
  return format(fromDayKey(key), 'EEE, MMM d')
}

export function formatDayFull(key: string): string {
  return format(fromDayKey(key), 'EEEE, MMMM d, yyyy')
}

export const WEEKDAYS_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

/** Human-readable description of a repeat config, e.g. "Weekly on Monday". */
export function describeRepeat(cfg: RepeatCfg): string {
  const interval = Math.max(1, cfg.interval || 1)
  switch (cfg.type) {
    case 'daily':
      return interval === 1 ? 'Daily' : `Every ${interval} days`
    case 'weekly': {
      const day = WEEKDAYS_LABELS[cfg.weekday ?? 1] ?? WEEKDAYS_LABELS[1]
      return interval === 1 ? `Weekly on ${day}` : `Every ${interval} weeks on ${day}`
    }
    case 'monthly': {
      const dom = ordinal(cfg.dayOfMonth ?? 1)
      return interval === 1 ? `Monthly on the ${dom}` : `Every ${interval} months on the ${dom}`
    }
    case 'yearly': {
      const month = MONTHS[cfg.month ?? 0] ?? MONTHS[0]
      const dom = ordinal(cfg.dayOfMonth ?? 1)
      return `Yearly on ${month} ${dom}`
    }
    case 'custom':
      return `Every ${interval} days`
    default:
      return ''
  }
}

/** Clamped "day of month" for a given year/month. */
function clampDom(year: number, month: number, dom: number): number {
  const last = new Date(year, month + 1, 0).getDate()
  return Math.min(Math.max(dom, 1), last)
}

/**
 * Next occurrence date strictly after `from` for a repeat config.
 * Returns null if the config is not resolvable.
 */
export function nextOccurrence(cfg: RepeatCfg, from: Date): Date | null {
  const base = startOfDay(from)
  const interval = Math.max(1, cfg.interval || 1)
  switch (cfg.type) {
    case 'daily':
      return addDays(base, interval)

    case 'weekly': {
      const target = cfg.weekday ?? getDay(base)
      let days = (target - getDay(base) + 7) % 7
      if (days === 0) days = 7
      let next = addDays(base, days)
      if (interval > 1) {
        const min = addWeeks(base, interval)
        while (dayKey(next) < dayKey(min)) next = addDays(next, 7)
      }
      return next
    }

    case 'monthly': {
      const dom = cfg.dayOfMonth ?? getDate(base)
      let year = base.getFullYear()
      let month = base.getMonth() + interval
      let candidate = new Date(year, month, clampDom(year, month, dom))
      if (dayKey(candidate) <= dayKey(base)) {
        candidate = new Date(year, base.getMonth() + interval + 1, clampDom(year, base.getMonth() + interval + 1, dom))
      }
      return candidate
    }

    case 'yearly': {
      const month = cfg.month ?? getMonth(base)
      const dom = cfg.dayOfMonth ?? getDate(base)
      let year = base.getFullYear()
      let candidate = new Date(year, month, clampDom(year, month, dom))
      if (dayKey(candidate) <= dayKey(base)) {
        candidate = new Date(year + 1, month, clampDom(year + 1, month, dom))
      }
      return candidate
    }

    case 'custom':
      return addDays(base, interval)

    default:
      return null
  }
}