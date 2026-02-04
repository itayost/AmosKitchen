/**
 * Order Status Utilities
 *
 * Centralized logic for order status handling, normalization, and transitions.
 */

import type { OrderStatus } from '@/lib/types/database'

// All valid order statuses
export const ORDER_STATUSES = [
  'PREPARING',
  'READY',
  'DELIVERED',
  'CANCELLED',
] as const

// Active order statuses (not completed or cancelled)
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'PREPARING',
  'READY',
]

// Status mapping for API communication (uppercase to lowercase)
const STATUS_TO_API: Record<OrderStatus, string> = {
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
}

// Status mapping from API (lowercase to uppercase)
const API_TO_STATUS: Record<string, OrderStatus> = {
  preparing: 'PREPARING',
  ready: 'READY',
  delivered: 'DELIVERED',
  cancelled: 'CANCELLED',
}

// Hebrew labels for statuses
export const STATUS_LABELS_HE: Record<OrderStatus, string> = {
  PREPARING: 'בהכנה',
  READY: 'מוכן',
  DELIVERED: 'נמסר',
  CANCELLED: 'בוטל',
}

// Action labels for status transitions (Hebrew)
export const STATUS_ACTION_LABELS_HE: Record<OrderStatus, string> = {
  PREPARING: 'סמן כמוכן',
  READY: 'סמן כנמסר',
  DELIVERED: 'הושלם',
  CANCELLED: 'בוטל',
}

// Status colors for UI
export const STATUS_COLORS: Record<OrderStatus, string> = {
  PREPARING: 'bg-yellow-500',
  READY: 'bg-green-500',
  DELIVERED: 'bg-gray-500',
  CANCELLED: 'bg-red-500',
}

// Status badge variants
export const STATUS_BADGE_VARIANTS: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PREPARING: 'default',
  READY: 'default',
  DELIVERED: 'secondary',
  CANCELLED: 'destructive',
}

/**
 * Normalize a status string to uppercase OrderStatus.
 * Handles both uppercase and lowercase inputs.
 * Maps legacy NEW/CONFIRMED statuses to PREPARING.
 */
export function normalizeStatus(status: string | undefined | null): OrderStatus {
  if (!status) return 'PREPARING'

  const upper = status.toUpperCase()

  // Map legacy statuses to PREPARING
  if (upper === 'NEW' || upper === 'CONFIRMED') {
    return 'PREPARING'
  }

  if (ORDER_STATUSES.includes(upper as OrderStatus)) {
    return upper as OrderStatus
  }

  // Try lowercase mapping
  const mapped = API_TO_STATUS[status.toLowerCase()]
  if (mapped) return mapped

  // Default to PREPARING if unrecognized
  return 'PREPARING'
}

/**
 * Convert an OrderStatus to API format (lowercase).
 */
export function statusToApi(status: OrderStatus): string {
  return STATUS_TO_API[status] || status.toLowerCase()
}

/**
 * Convert an API status to OrderStatus (uppercase).
 */
export function apiToStatus(apiStatus: string): OrderStatus {
  return API_TO_STATUS[apiStatus.toLowerCase()] || 'PREPARING'
}

/**
 * Get the next status in the order workflow.
 */
export function getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
  const transitions: Record<OrderStatus, OrderStatus | null> = {
    PREPARING: 'READY',
    READY: 'DELIVERED',
    DELIVERED: null,
    CANCELLED: null,
  }
  return transitions[currentStatus]
}

/**
 * Get the previous status in the order workflow.
 */
export function getPreviousStatus(currentStatus: OrderStatus): OrderStatus | null {
  const transitions: Record<OrderStatus, OrderStatus | null> = {
    PREPARING: null,
    READY: 'PREPARING',
    DELIVERED: 'READY',
    CANCELLED: null,
  }
  return transitions[currentStatus]
}

/**
 * Check if a status is considered active (not completed or cancelled).
 */
export function isActiveStatus(status: OrderStatus): boolean {
  return ACTIVE_ORDER_STATUSES.includes(status)
}

/**
 * Check if a status allows order modifications.
 * Only PREPARING orders can be modified.
 */
export function canModifyOrder(status: OrderStatus): boolean {
  return status === 'PREPARING'
}

/**
 * Check if an order can be cancelled.
 */
export function canCancelOrder(status: OrderStatus): boolean {
  return status !== 'DELIVERED' && status !== 'CANCELLED'
}

/**
 * Get Hebrew label for a status.
 */
export function getStatusLabel(status: OrderStatus): string {
  return STATUS_LABELS_HE[status] || status
}

/**
 * Get Hebrew action label for transitioning to the next status.
 */
export function getStatusActionLabel(status: OrderStatus): string {
  return STATUS_ACTION_LABELS_HE[status] || 'עדכן סטטוס'
}

/**
 * Get the color class for a status.
 */
export function getStatusColor(status: OrderStatus): string {
  return STATUS_COLORS[status] || 'bg-gray-500'
}
