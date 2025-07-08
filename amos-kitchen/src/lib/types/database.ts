// lib/types/database.ts

// Customer Types
export interface Customer {
    id: string
    name: string
    phone: string
    email?: string | null
    address?: string | null
    notes?: string | null
    createdAt: Date
    updatedAt: Date
}

// Order Status
export type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

// Prisma Order Status (for mapping)
export type PrismaOrderStatus = 'NEW' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'

// Dish Types
export interface Dish {
    id: string
    name: string
    description?: string | null
    price: number
    category: string
    isAvailable: boolean
    imageUrl?: string | null
    createdAt: Date
    updatedAt: Date
}

// Order Item Types
export interface OrderItem {
    id: string
    orderId: string
    dishId: string
    dish: Dish
    quantity: number
    price: number
    notes?: string | null
    createdAt: Date
    updatedAt: Date
}

// Order Types
export interface Order {
    id: string
    orderNumber: string
    customerId: string
    customer: Customer
    deliveryDate: Date
    deliveryAddress?: string | null
    status: OrderStatus
    totalAmount: number
    notes?: string | null
    orderItems: OrderItem[]
    createdAt: Date
    updatedAt: Date
}

// Filter Types
export interface OrderFilters {
    search: string
    status: OrderStatus | 'all'
    dateRange: 'all' | 'today' | 'week' | 'month'
    page: number
    limit: number
}

// Ingredient Types
export interface Ingredient {
    id: string
    name: string
    unit: string
    currentStock?: number | null
    minStock?: number | null
    createdAt: Date
    updatedAt: Date
}

// Dish Ingredient Types
export interface DishIngredient {
    id: string
    dishId: string
    dish: Dish
    ingredientId: string
    ingredient: Ingredient
    quantity: number
    createdAt: Date
    updatedAt: Date
}

// API Response Types
export interface OrdersResponse {
    orders: Order[]
    totalCount: number
    currentPage: number
    totalPages: number
}

export interface ApiError {
    error: string
    details?: any
}

// Form Types
export interface CreateOrderInput {
    customerId: string
    deliveryDate: string
    deliveryAddress?: string
    notes?: string
    items: {
        dishId: string
        quantity: number
        price: number
        notes?: string
    }[]
}

export interface UpdateOrderInput {
    status?: OrderStatus
    deliveryDate?: string
    deliveryAddress?: string
    notes?: string
    items?: {
        id?: string
        dishId: string
        quantity: number
        price: number
        notes?: string
    }[]
}
