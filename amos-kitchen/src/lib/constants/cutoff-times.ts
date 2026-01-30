/**
 * Cutoff Time Constants
 *
 * Centralized configuration for order cutoff times.
 * Eliminates magic numbers in use-kitchen-orders.ts and other files.
 */

// Day of week constants
export const DAYS = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const

// Cutoff time configuration
export const CUTOFF_CONFIG = {
  // Thursday ordering cutoff (orders close at 6 PM)
  THURSDAY_CUTOFF_HOUR: 18,
  // Thursday warning starts at 4 PM (2 hours before cutoff)
  THURSDAY_WARNING_HOUR: 16,

  // Friday final cutoff (for any last-minute changes)
  FRIDAY_CUTOFF_HOUR: 12,
  // Friday warning starts at 10 AM
  FRIDAY_WARNING_HOUR: 10,
} as const

export type CutoffStatus = 'open' | 'warning' | 'closed'

export interface CutoffInfo {
  status: CutoffStatus
  timeUntilCutoff?: number // minutes until cutoff
  message?: string
}

/**
 * Calculate the current cutoff status based on day and time.
 *
 * @param now Optional current date (defaults to now)
 * @returns CutoffInfo with status, time remaining, and message
 */
export function getCutoffStatus(now: Date = new Date()): CutoffInfo {
  const dayOfWeek = now.getDay()
  const hour = now.getHours()
  const minutes = now.getMinutes()

  // Not Thursday or Friday - orders are open
  if (dayOfWeek !== DAYS.THURSDAY && dayOfWeek !== DAYS.FRIDAY) {
    return { status: 'open' }
  }

  // Thursday after 6 PM or Friday after 12 PM = closed
  if (
    (dayOfWeek === DAYS.THURSDAY && hour >= CUTOFF_CONFIG.THURSDAY_CUTOFF_HOUR) ||
    (dayOfWeek === DAYS.FRIDAY && hour >= CUTOFF_CONFIG.FRIDAY_CUTOFF_HOUR)
  ) {
    return {
      status: 'closed',
      message: 'ההזמנות סגורות לשבוע זה',
    }
  }

  // Warning period
  if (
    (dayOfWeek === DAYS.THURSDAY && hour >= CUTOFF_CONFIG.THURSDAY_WARNING_HOUR) ||
    (dayOfWeek === DAYS.FRIDAY && hour >= CUTOFF_CONFIG.FRIDAY_WARNING_HOUR)
  ) {
    let timeUntilCutoff: number

    if (dayOfWeek === DAYS.THURSDAY) {
      timeUntilCutoff = (CUTOFF_CONFIG.THURSDAY_CUTOFF_HOUR - hour) * 60 - minutes
    } else {
      timeUntilCutoff = (CUTOFF_CONFIG.FRIDAY_CUTOFF_HOUR - hour) * 60 - minutes
    }

    return {
      status: 'warning',
      timeUntilCutoff,
      message: `ההזמנות נסגרות בעוד ${timeUntilCutoff} דקות`,
    }
  }

  return { status: 'open' }
}

/**
 * Format the time until cutoff for display.
 *
 * @param minutes Number of minutes until cutoff
 * @returns Formatted time string (e.g., "2 שעות ו-30 דקות")
 */
export function formatTimeUntilCutoff(minutes: number): string {
  if (minutes <= 0) return 'הזמן נגמר'

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) {
    return `${remainingMinutes} דקות`
  }

  if (remainingMinutes === 0) {
    return `${hours} שעות`
  }

  return `${hours} שעות ו-${remainingMinutes} דקות`
}

/**
 * Check if we're within the warning period for cutoff.
 *
 * @param now Optional current date
 * @returns true if in warning period
 */
export function isInWarningPeriod(now: Date = new Date()): boolean {
  return getCutoffStatus(now).status === 'warning'
}

/**
 * Check if orders are currently closed.
 *
 * @param now Optional current date
 * @returns true if orders are closed
 */
export function areOrdersClosed(now: Date = new Date()): boolean {
  return getCutoffStatus(now).status === 'closed'
}
