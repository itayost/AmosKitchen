// lib/types/kitchen.ts
import type { Order, Customer, CustomerPreference, OrderItem, Dish, OrderStatus } from './database'
import { ChefHat, Package, Truck, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Extended Kitchen Order with customer preferences and dish details
export interface KitchenOrder extends Omit<Order, 'orderItems'> {
  customer: Customer & {
    preferences?: CustomerPreference[]
  }
  orderItems: (Omit<OrderItem, 'dish'> & {
    dish: Dish
  })[]
}

// Kitchen statistics
export interface KitchenStats {
  totalOrders: number
  totalDishes: number
  totalRevenue: number
  criticalPreferenceCount: number
  byStatus: Record<OrderStatus, number>
  cutoffStatus: 'open' | 'warning' | 'closed'
  timeUntilCutoff?: number // minutes
}

// Dish aggregation for batch cooking
export interface DishAggregation {
  id: string
  name: string
  category: string
  totalQuantity: number
  orderCount: number
  isPrepared?: boolean // UI state only
  orders: {
    orderId: string
    orderNumber: string
    customerName: string
    quantity: number
    notes?: string
  }[]
}

// Kanban column configuration
export interface KanbanColumnConfig {
  id: OrderStatus
  title: string
  color: string // Tailwind bg class
  textColor: string // Tailwind text class
  icon: LucideIcon
}

// Define Kanban columns for the kitchen workflow
export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: 'PREPARING',
    title: 'בהכנה',
    color: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    icon: ChefHat
  },
  {
    id: 'READY',
    title: 'מוכן',
    color: 'bg-green-100',
    textColor: 'text-green-700',
    icon: Package
  },
  {
    id: 'DELIVERED',
    title: 'נמסר',
    color: 'bg-gray-100',
    textColor: 'text-gray-700',
    icon: Truck
  },
]

// All statuses including cancelled
export const ALL_STATUSES: KanbanColumnConfig[] = [
  ...KANBAN_COLUMNS,
  {
    id: 'CANCELLED',
    title: 'בוטל',
    color: 'bg-red-100',
    textColor: 'text-red-700',
    icon: XCircle
  },
]

// Get column config by status
export function getColumnConfig(status: OrderStatus): KanbanColumnConfig {
  return ALL_STATUSES.find(col => col.id === status) || ALL_STATUSES[0]
}

// Status labels in Hebrew
export const STATUS_LABELS: Record<OrderStatus, string> = {
  PREPARING: 'בהכנה',
  READY: 'מוכן',
  DELIVERED: 'נמסר',
  CANCELLED: 'בוטל'
}

// Print view types
export type PrintViewType = 'dish-checklist' | 'delivery-route' | 'order-receipts'

// Preparation progress tracking (UI only)
export interface PreparationProgress {
  [orderId: string]: {
    [itemId: string]: boolean
  }
}
