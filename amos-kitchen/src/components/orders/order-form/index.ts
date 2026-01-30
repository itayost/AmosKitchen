/**
 * Order Form Components
 *
 * Extracted from the monolithic order-form.tsx (642 lines) to improve
 * maintainability and follow Single Responsibility Principle.
 *
 * Usage:
 * ```tsx
 * import {
 *   CustomerSelectionCard,
 *   DeliveryDetailsCard,
 *   OrderItemsCard
 * } from '@/components/orders/order-form'
 * ```
 */

export { CustomerSelectionCard } from './customer-selection-card'
export type { CustomerWithPreferences } from './customer-selection-card'

export { DeliveryDetailsCard } from './delivery-details-card'

export { OrderItemsCard } from './order-items-card'
