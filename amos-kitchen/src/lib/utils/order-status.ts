/**
 * Order Status Utilities
 *
 * Centralized logic for order status handling, normalization, and transitions.
 * Eliminates scattered status mapping across kitchen-dashboard.tsx, use-kitchen-orders.ts, etc.
 */

import type { OrderStatus } from '@/lib/types/database'

// All valid order statuses
export const ORDER_STATUSES = [
  'NEW',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'DELIVERED',
  'CANCELLED',
] as const

// Active order statuses (not completed or cancelled)
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'NEW',
  'CONFIRMED',
  'PREPARING',
  'READY',
]

// Status mapping for API communication (uppercase to lowercase)
const STATUS_TO_API: Record<OrderStatus, string> = {
  NEW: 'new',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
}

// Status mapping from API (lowercase to uppercase)
const API_TO_STATUS: Record<string, OrderStatus> = {
  new: 'NEW',
  confirmed: 'CONFIRMED',
  preparing: 'PREPARING',
  ready: 'READY',
  delivered: 'DELIVERED',
  cancelled: 'CANCELLED',
}

// Hebrew labels for statuses
export const STATUS_LABELS_HE: Record<OrderStatus, string> = {
  NEW: 'חדש',
  CONFIRMED: 'מאושר',
  PREPARING: 'בהכנה',
  READY: 'מוכן',
  DELIVERED: 'נמסר',
  CANCELLED: 'בוטל',
}

// Action labels for status transitions (Hebrew)
export const STATUS_ACTION_LABELS_HE: Record<OrderStatus, string> = {
  NEW: 'אשר הזמנה',
  CONFIRMED: 'התחל הכנה',
  PREPARING: 'סמן כמוכן',
  READY: 'סמן כנמסר',
  DELIVERED: 'הושלם',
  CANCELLED: 'בוטל',
}

// Status colors for UI
export const STATUS_COLORS: Record<OrderStatus, string> = {
  NEW: 'bg-purple-500',
  CONFIRMED: 'bg-blue-500',
  PREPARING: 'bg-yellow-500',
  READY: 'bg-green-500',
  DELIVERED: 'bg-gray-500',
  CANCELLED: 'bg-red-500',
}

// Status badge variants
export const STATUS_BADGE_VARIANTS: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  NEW: 'secondary',
  CONFIRMED: 'outline',
  PREPARING: 'default',
  READY: 'default',
  DELIVERED: 'secondary',
  CANCELLED: 'destructive',
}

/**
 * Normalize a status string to uppercase OrderStatus.
 * Handles both uppercase and lowercase inputs.
 *
 * @param status The status string (can be any case)
 * @returns Normalized uppercase OrderStatus
 */
export function normalizeStatus(status: string | undefined | null): OrderStatus {
  if (!status) return 'NEW'

  const upper = status.toUpperCase()
  if (ORDER_STATUSES.includes(upper as OrderStatus)) {
    return upper as OrderStatus
  }

  // Try lowercase mapping
  const mapped = API_TO_STATUS[status.toLowerCase()]
  if (mapped) return mapped

  // Default to NEW if unrecognized
  return 'NEW'
}

/**
 * Convert an OrderStatus to API format (lowercase).
 *
 * @param status The OrderStatus to convert
 * @returns Lowercase status string for API
 */
export function statusToApi(status: OrderStatus): string {
  return STATUS_TO_API[status] || status.toLowerCase()
}

/**
 * Convert an API status to OrderStatus (uppercase).
 *
 * @param apiStatus The lowercase status from API
 * @returns Uppercase OrderStatus
 */
export function apiToStatus(apiStatus: string): OrderStatus {
  return API_TO_STATUS[apiStatus.toLowerCase()] || 'NEW'
}

/**
 * Get the next status in the order workflow.
 *
 * @param currentStatus The current order status
 * @returns The next status, or null if no transition available
 */
export function getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
  const transitions: Record<OrderStatus, OrderStatus | null> = {
    NEW: 'CONFIRMED',
    CONFIRMED: 'PREPARING',
    PREPARING: 'READY',
    READY: 'DELIVERED',
    DELIVERED: null,
    CANCELLED: null,
  }
  return transitions[currentStatus]
}

/**
 * Get the previous status in the order workflow.
 *
 * @param currentStatus The current order status
 * @returns The previous status, or null if no transition available
 */
export function getPreviousStatus(currentStatus: OrderStatus): OrderStatus | null {
  const transitions: Record<OrderStatus, OrderStatus | null> = {
    NEW: null,
    CONFIRMED: 'NEW',
    PREPARING: 'CONFIRMED',
    READY: 'PREPARING',
    DELIVERED: 'READY',
    CANCELLED: null,
  }
  return transitions[currentStatus]
}

/**
 * Check if a status is considered active (not completed or cancelled).
 *
 * @param status The status to check
 * @returns true if the status is active
 */
export function isActiveStatus(status: OrderStatus): boolean {
  return ACTIVE_ORDER_STATUSES.includes(status)
}

/**
 * Check if a status allows order modifications.
 *
 * @param status The status to check
 * @returns true if modifications are allowed
 */
export function canModifyOrder(status: OrderStatus): boolean {
  return status === 'NEW' || status === 'CONFIRMED'
}

/**
 * Check if an order can be cancelled.
 *
 * @param status The current order status
 * @returns true if the order can be cancelled
 */
export function canCancelOrder(status: OrderStatus): boolean {
  return status !== 'DELIVERED' && status !== 'CANCELLED'
}

/**
 * Get Hebrew label for a status.
 *
 * @param status The order status
 * @returns Hebrew label string
 */
export function getStatusLabel(status: OrderStatus): string {
  return STATUS_LABELS_HE[status] || status
}

/**
 * Get Hebrew action label for transitioning to the next status.
 *
 * @param status The current order status
 * @returns Hebrew action label string
 */
export function getStatusActionLabel(status: OrderStatus): string {
  return STATUS_ACTION_LABELS_HE[status] || 'עדכן סטטוס'
}

/**
 * Get the color class for a status.
 *
 * @param status The order status
 * @returns Tailwind color class string
 */
export function getStatusColor(status: OrderStatus): string {
  return STATUS_COLORS[status] || 'bg-gray-500'
}
