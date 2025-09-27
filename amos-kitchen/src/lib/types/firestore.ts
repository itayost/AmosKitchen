// lib/types/firestore.ts
import { Timestamp, FieldValue } from 'firebase/firestore'

// Customer types
export interface Customer {
  id?: string
  name: string
  phone: string
  email?: string | null
  address?: string | null
  notes?: string | null
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
}

export interface CustomerPreference {
  id?: string
  customerId: string
  type: 'ALLERGY' | 'DIETARY_RESTRICTION' | 'PREFERENCE' | 'MEDICAL'
  value: string
  notes?: string | null
  createdAt: Timestamp | FieldValue
}

// Dish types
export interface Dish {
  id?: string
  name: string
  description?: string | null
  price: number
  category?: string | null
  isAvailable: boolean
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
}

// Order types
export interface Order {
  id?: string
  orderNumber: string
  customerId: string
  customerData?: {
    name: string
    phone: string
    email?: string | null
  }
  orderDate: Timestamp | FieldValue
  deliveryDate: Timestamp | FieldValue
  deliveryAddress?: string | null
  status: 'NEW' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
  totalAmount: number
  notes?: string | null
  items: OrderItem[]
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
}

export interface OrderItem {
  dishId: string
  dishName: string
  quantity: number
  price: number
  notes?: string | null
}

export interface OrderHistory {
  id?: string
  orderId: string
  userId?: string | null
  action: string
  details: any
  createdAt: Timestamp | FieldValue
}

// Helper type for order counter
export interface OrderCounter {
  count: number
  year: number
}

// Query filter types
export interface OrderFilters {
  search?: string
  status?: string
  dateRange?: 'all' | 'today' | 'week' | 'month'
  startDate?: Date
  endDate?: Date
  customerId?: string
}