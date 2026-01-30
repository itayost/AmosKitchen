/**
 * Friday Date Utilities
 *
 * Centralized logic for Friday delivery date calculations.
 * This eliminates duplication across order-form.tsx and order-wizard-context.tsx.
 */

import { format } from 'date-fns'
import { he } from 'date-fns/locale'

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

// Cutoff time constants
export const CUTOFF_TIMES = {
  THURSDAY_HOUR: 18,  // 6 PM Thursday
  FRIDAY_HOUR: 12,    // 12 PM Friday (noon)
} as const

/**
 * Get the next available Friday for delivery based on current time and cutoff rules.
 *
 * Rules:
 * - Thursday after 6 PM: Skip to next Friday
 * - Friday after 12 PM: Skip to next Friday
 * - Saturday or Sunday: Calculate days to next Friday
 * - Other days: Get the coming Friday
 */
export function getNextAvailableFriday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const currentDay = today.getDay()
  let daysUntilFriday = (DAYS.FRIDAY - currentDay + 7) % 7

  // Thursday after cutoff (6 PM) - skip to next Friday
  if (currentDay === DAYS.THURSDAY) {
    const now = new Date()
    const cutoffTime = new Date(today)
    cutoffTime.setHours(CUTOFF_TIMES.THURSDAY_HOUR, 0, 0, 0)

    if (now >= cutoffTime) {
      daysUntilFriday = 8 // Next Friday (skip this week)
    } else {
      daysUntilFriday = 1 // Tomorrow (Friday)
    }
  }

  // Friday - check if before delivery cutoff
  if (currentDay === DAYS.FRIDAY) {
    const now = new Date()
    const cutoffTime = new Date(today)
    cutoffTime.setHours(CUTOFF_TIMES.FRIDAY_HOUR, 0, 0, 0)

    if (now >= cutoffTime) {
      daysUntilFriday = 7 // Next Friday
    } else {
      daysUntilFriday = 0 // Today
    }
  }

  // Saturday or Sunday - calculate days to next Friday
  if (currentDay === DAYS.SATURDAY || currentDay === DAYS.SUNDAY) {
    daysUntilFriday = currentDay === DAYS.SATURDAY ? 6 : 5
  }

  const nextFriday = new Date(today)
  nextFriday.setDate(today.getDate() + daysUntilFriday)
  return nextFriday
}

/**
 * Get all available Fridays for the next N weeks.
 *
 * @param count Number of Fridays to return (default: 4)
 * @returns Array of Friday dates
 */
export function getAvailableFridays(count: number = 4): Date[] {
  const fridays: Date[] = []
  const firstFriday = getNextAvailableFriday()

  for (let i = 0; i < count; i++) {
    const friday = new Date(firstFriday)
    friday.setDate(firstFriday.getDate() + (i * 7))
    fridays.push(friday)
  }

  return fridays
}

/**
 * Format a delivery date for Hebrew display.
 *
 * @param date The date to format
 * @returns Formatted Hebrew date string (e.g., "יום שישי, 15 בינואר 2025")
 */
export function formatDeliveryDate(date: Date): string {
  return format(date, 'EEEE, dd בMMMM yyyy', { locale: he })
}

/**
 * Check if a given date is a valid Friday for delivery.
 *
 * @param date The date to validate
 * @returns true if the date is a Friday
 */
export function isValidDeliveryFriday(date: Date): boolean {
  return date.getDay() === DAYS.FRIDAY
}

/**
 * Get the cutoff datetime for a specific Friday delivery.
 *
 * @param fridayDate The Friday delivery date
 * @returns The Thursday 6 PM cutoff datetime
 */
export function getCutoffDatetime(fridayDate: Date): Date {
  const cutoff = new Date(fridayDate)
  cutoff.setDate(fridayDate.getDate() - 1) // Thursday
  cutoff.setHours(CUTOFF_TIMES.THURSDAY_HOUR, 0, 0, 0)
  return cutoff
}

/**
 * Check if orders can still be placed for a specific Friday.
 *
 * @param fridayDate The Friday delivery date
 * @returns true if orders are still open
 */
export function isOrderingOpen(fridayDate: Date): boolean {
  const now = new Date()
  const cutoff = getCutoffDatetime(fridayDate)
  return now < cutoff
}
