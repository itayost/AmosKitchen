// lib/constants/friday.ts
// Friday-centric business logic constants

/**
 * Thursday cutoff hour (24h format)
 * Orders for Friday must be placed before this time on Thursday
 */
export const THURSDAY_CUTOFF_HOUR = 18 // 6 PM

/**
 * Friday delivery cutoff hour (24h format)
 * Same-day Friday orders must be placed before this time
 */
export const FRIDAY_DELIVERY_CUTOFF_HOUR = 12 // 12 PM (noon)

/**
 * Hours before cutoff to show "cutoff-soon" warning
 */
export const CUTOFF_WARNING_HOURS = 2

/**
 * Auto-refresh interval for Friday data in milliseconds
 * 5 minutes = 300,000ms
 */
export const FRIDAY_DATA_REFRESH_INTERVAL_MS = 5 * 60 * 1000

/**
 * Get the next Friday date from the current date
 */
export function getNextFriday(from: Date = new Date()): Date {
  const day = from.getDay()
  // 5 = Friday
  const daysUntilFriday = day <= 5 ? 5 - day : 7 - day + 5
  const friday = new Date(from)
  friday.setDate(friday.getDate() + daysUntilFriday)
  friday.setHours(12, 0, 0, 0) // Set to noon
  return friday
}

/**
 * Get the current Friday ordering status
 */
export type FridayStatus = 'open' | 'cutoff-soon' | 'closed'

export function getFridayStatus(): FridayStatus {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const hour = now.getHours()

  // Friday or Saturday - closed
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    return 'closed'
  }

  // Thursday after cutoff - closed
  if (dayOfWeek === 4 && hour >= THURSDAY_CUTOFF_HOUR) {
    return 'closed'
  }

  // Thursday before cutoff but within warning period - cutoff-soon
  if (dayOfWeek === 4 && hour >= THURSDAY_CUTOFF_HOUR - CUTOFF_WARNING_HOURS) {
    return 'cutoff-soon'
  }

  // Otherwise open
  return 'open'
}
