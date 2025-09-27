// lib/types/database.ts

// Preference Types
export type PreferenceType = 'ALLERGY' | 'DIETARY_RESTRICTION' | 'PREFERENCE' | 'MEDICAL'

// Customer Preference Types
export interface CustomerPreference {
    id: string
    customerId: string
    type: PreferenceType
    value: string
    notes?: string | null
    createdAt: Date
    updatedAt: Date
}

// Customer Types
export interface Customer {
    id: string
    name: string
    phone: string
    email?: string | null
    address?: string | null
    notes?: string | null
    preferences?: CustomerPreference[]
    createdAt: Date
    updatedAt: Date
}

// Extended Customer with stats (for list views)
export interface CustomerWithStats extends Customer {
    orderCount?: number
    totalSpent?: number
    lastOrderDate?: Date | null
}

// Order Status
export type OrderStatus = 'NEW' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'

// Prisma Order Status (for mapping)
export type PrismaOrderStatus = 'NEW' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'

export interface OrderHistory {
    id: string;
    orderId: string;
    userId: string;
    action: string;
    details: any;
    createdAt: Date;
}

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
    customer?: Customer
    orderDate: Date
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

// Customer Form Types
export interface CreateCustomerInput {
    name: string
    phone: string
    email?: string | null
    address?: string | null
    notes?: string | null
    preferences?: CreateCustomerPreferenceInput[]
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
    preferences?: CreateCustomerPreferenceInput[]
}

export interface CreateCustomerPreferenceInput {
    type: PreferenceType
    value: string
    notes?: string | null
}

// Preference helpers
export const PREFERENCE_TYPE_LABELS: Record<PreferenceType, string> = {
    ALLERGY: 'אלרגיה',
    DIETARY_RESTRICTION: 'הגבלה תזונתית',
    PREFERENCE: 'העדפה',
    MEDICAL: 'רפואי'
}

export const PREFERENCE_TYPE_COLORS: Record<PreferenceType, string> = {
    ALLERGY: 'destructive',
    DIETARY_RESTRICTION: 'warning',
    PREFERENCE: 'secondary',
    MEDICAL: 'destructive'
}

export const PREFERENCE_TYPE_ICONS: Record<PreferenceType, string> = {
    ALLERGY: 'alert-triangle',
    DIETARY_RESTRICTION: 'utensils',
    PREFERENCE: 'heart',
    MEDICAL: 'stethoscope'
}

// Utility type for preference grouping
export interface GroupedPreferences {
    ALLERGY: CustomerPreference[]
    DIETARY_RESTRICTION: CustomerPreference[]
    PREFERENCE: CustomerPreference[]
    MEDICAL: CustomerPreference[]
}

// Helper function to group preferences by type
export function groupPreferencesByType(preferences: CustomerPreference[]): GroupedPreferences {
    return preferences.reduce((acc, pref) => {
        if (!acc[pref.type]) {
            acc[pref.type] = []
        }
        acc[pref.type].push(pref)
        return acc
    }, {
        ALLERGY: [],
        DIETARY_RESTRICTION: [],
        PREFERENCE: [],
        MEDICAL: []
    } as GroupedPreferences)
}

// Helper function to get preference priority (for sorting)
export function getPreferencePriority(type: PreferenceType): number {
    const priorities: Record<PreferenceType, number> = {
        ALLERGY: 1,
        MEDICAL: 2,
        DIETARY_RESTRICTION: 3,
        PREFERENCE: 4
    }
    return priorities[type] || 999
}

// Helper function to sort preferences by priority
export function sortPreferencesByPriority(preferences: CustomerPreference[]): CustomerPreference[] {
    return [...preferences].sort((a, b) => {
        return getPreferencePriority(a.type) - getPreferencePriority(b.type)
    })
}
