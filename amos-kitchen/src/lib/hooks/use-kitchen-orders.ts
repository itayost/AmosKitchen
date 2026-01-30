// lib/hooks/use-kitchen-orders.ts
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import { useToast } from '@/lib/hooks/use-toast'
import { getDishesByIds } from '@/lib/firebase/dao/dishes'
import { getCustomerById, getCustomerPreferences } from '@/lib/firebase/dao/customers'
import { normalizeStatus, statusToApi, ACTIVE_ORDER_STATUSES } from '@/lib/utils/order-status'
import { getCutoffStatus } from '@/lib/constants/cutoff-times'
import type { KitchenOrder, KitchenStats, PreparationProgress } from '@/lib/types/kitchen'
import type { OrderStatus } from '@/lib/types/database'

interface UseKitchenOrdersOptions {
  deliveryDate?: Date | null
  statuses?: OrderStatus[]
  // autoRefresh is reserved for future polling fallback
}

interface UseKitchenOrdersResult {
  orders: KitchenOrder[]
  groupedOrders: Record<OrderStatus, KitchenOrder[]>
  stats: KitchenStats
  isLoading: boolean
  error: Error | null
  isConnected: boolean
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>
  isUpdating: boolean
  preparationProgress: PreparationProgress
  setPreparationProgress: React.Dispatch<React.SetStateAction<PreparationProgress>>
  refetch: () => Promise<void>
}

// Use centralized active statuses
const ACTIVE_STATUSES = ACTIVE_ORDER_STATUSES

// LocalStorage key for preparation progress
const getProgressStorageKey = (date?: Date | null) => {
  if (!date) return 'kitchen_prep_progress_default'
  const dateStr = date.toISOString().split('T')[0]
  return `kitchen_prep_progress_${dateStr}`
}

// Load progress from localStorage
const loadProgressFromStorage = (date?: Date | null): PreparationProgress => {
  if (typeof window === 'undefined') return {}
  try {
    const key = getProgressStorageKey(date)
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Save progress to localStorage
const saveProgressToStorage = (date: Date | null | undefined, progress: PreparationProgress) => {
  if (typeof window === 'undefined') return
  try {
    const key = getProgressStorageKey(date)
    localStorage.setItem(key, JSON.stringify(progress))
  } catch {
    // Silently fail if localStorage is full or unavailable
  }
}

export function useKitchenOrders({
  deliveryDate,
  statuses = ACTIVE_STATUSES,
}: UseKitchenOrdersOptions = {}): UseKitchenOrdersResult {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  // Initialize preparation progress from localStorage
  const [preparationProgress, setPreparationProgress] = useState<PreparationProgress>(() =>
    loadProgressFromStorage(deliveryDate)
  )
  const { toast } = useToast()

  // Persist preparation progress to localStorage
  useEffect(() => {
    saveProgressToStorage(deliveryDate, preparationProgress)
  }, [preparationProgress, deliveryDate])

  // Transform raw order data to KitchenOrder with populated relations
  const transformOrders = useCallback(async (rawOrders: any[]): Promise<KitchenOrder[]> => {
    // Filter out cancelled orders if not in requested statuses
    const filteredOrders = rawOrders.filter(order =>
      statuses.includes(normalizeStatus(order.status))
    )

    // Get all unique dish and customer IDs
    const dishIds = new Set<string>()
    const customerIds = new Set<string>()

    filteredOrders.forEach(order => {
      customerIds.add(order.customerId)
      order.items?.forEach((item: any) => dishIds.add(item.dishId))
    })

    // Fetch dishes and customers in parallel
    const [dishes, ...customerData] = await Promise.all([
      getDishesByIds(Array.from(dishIds)),
      ...Array.from(customerIds).map(async id => {
        const [customer, preferences] = await Promise.all([
          getCustomerById(id),
          getCustomerPreferences(id)
        ])
        return { id, customer, preferences }
      })
    ])

    const dishMap = new Map(dishes.map(d => [d.id, d]))
    const customerMap = new Map(customerData.map(c => [c.id, { ...c.customer, preferences: c.preferences }]))

    // Transform orders
    return filteredOrders.map(order => {
      const customer = customerMap.get(order.customerId)

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        status: normalizeStatus(order.status),
        totalAmount: order.totalAmount,
        notes: order.notes,
        deliveryAddress: order.deliveryAddress,
        orderDate: order.orderDate instanceof Timestamp ? order.orderDate.toDate() : new Date(order.orderDate),
        deliveryDate: order.deliveryDate instanceof Timestamp ? order.deliveryDate.toDate() : new Date(order.deliveryDate),
        createdAt: order.createdAt instanceof Timestamp ? order.createdAt.toDate() : new Date(order.createdAt),
        updatedAt: order.updatedAt instanceof Timestamp ? order.updatedAt.toDate() : new Date(order.updatedAt),
        customer: {
          id: order.customerId,
          name: order.customerData?.name || customer?.name || 'Unknown',
          phone: order.customerData?.phone || customer?.phone || '',
          email: order.customerData?.email || customer?.email || null,
          address: customer?.address || null,
          notes: customer?.notes || null,
          preferences: customer?.preferences || [],
          createdAt: customer?.createdAt || new Date(),
          updatedAt: customer?.updatedAt || new Date()
        },
        orderItems: (order.items || []).map((item: any, index: number) => {
          const dish = dishMap.get(item.dishId)
          return {
            id: item.id || `${order.id}-${index}`,
            orderId: order.id,
            dishId: item.dishId,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
            createdAt: new Date(),
            updatedAt: new Date(),
            dish: dish || {
              id: item.dishId,
              name: item.dishName || 'Unknown Dish',
              category: 'MAIN',
              price: item.price,
              description: null,
              isAvailable: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        })
      }
    }) as KitchenOrder[]
  }, [statuses])

  // Fetch orders via API (fallback / initial load)
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetchWithAuth('/api/orders/next-delivery')
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      const data = await response.json()

      // Normalize and set orders
      const normalizedOrders = (data.orders || []).map((order: any) => ({
        ...order,
        status: normalizeStatus(order.status)
      }))

      setOrders(normalizedOrders)
      setError(null)
      setIsConnected(true)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Set up Firebase real-time listener
  useEffect(() => {
    if (!deliveryDate) {
      // No delivery date - use API fetch
      fetchOrders()
      return
    }

    setIsLoading(true)

    // Build date range for the delivery date
    const startOfDay = new Date(deliveryDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(deliveryDate)
    endOfDay.setHours(23, 59, 59, 999)

    const ordersRef = collection(db, 'orders')

    const constraints: QueryConstraint[] = [
      where('deliveryDate', '>=', Timestamp.fromDate(startOfDay)),
      where('deliveryDate', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('deliveryDate', 'asc'),
      orderBy('createdAt', 'desc')
    ]

    const q = query(ordersRef, ...constraints)

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const rawOrders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))

          const transformedOrders = await transformOrders(rawOrders)
          setOrders(transformedOrders)
          setIsLoading(false)
          setError(null)
          setIsConnected(true)
        } catch (err) {
          console.error('Error transforming orders:', err)
          setError(err as Error)
          setIsLoading(false)
        }
      },
      (err) => {
        console.error('Firestore listener error:', err)
        setError(err as Error)
        setIsLoading(false)
        setIsConnected(false)

        // Show appropriate toast based on error type
        if ((err as any).code === 'permission-denied') {
          toast({
            title: 'שגיאת הרשאה',
            description: 'אין לך הרשאה לצפות בהזמנות',
            variant: 'destructive'
          })
        } else if ((err as any).code === 'unavailable') {
          toast({
            title: 'בעיית חיבור',
            description: 'מנסה להתחבר מחדש...',
          })
        }

        // Fallback to API fetch
        fetchOrders()
      }
    )

    return () => unsubscribe()
  }, [deliveryDate, fetchOrders, toast, transformOrders])

  // Update order status with optimistic updates
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    // Store previous state for rollback using functional update to avoid stale closure
    let previousOrders: KitchenOrder[] = []

    // Optimistic update - use functional form
    setOrders(prev => {
      previousOrders = [...prev]
      return prev.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    })

    // Clear preparation progress when moving to READY
    if (newStatus === 'READY') {
      setPreparationProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[orderId]
        return newProgress
      })
    }

    setIsUpdating(true)
    try {
      // Use centralized status conversion
      const mappedStatus = statusToApi(newStatus)

      const response = await fetchWithAuth(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: mappedStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      // Firebase listener will update with confirmed data
      toast({
        title: 'הסטטוס עודכן',
        description: `ההזמנה עודכנה בהצלחה`,
      })
    } catch (err) {
      console.error('Error updating order status:', err)

      // Rollback optimistic update
      setOrders(previousOrders)

      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן את הסטטוס. נסה שוב.',
        variant: 'destructive',
      })

      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [toast]) // Removed 'orders' from deps to prevent stale closure

  // Group orders by status
  const groupedOrders = useMemo(() => {
    const groups: Record<OrderStatus, KitchenOrder[]> = {
      NEW: [],
      CONFIRMED: [],
      PREPARING: [],
      READY: [],
      DELIVERED: [],
      CANCELLED: []
    }

    orders.forEach(order => {
      if (groups[order.status]) {
        groups[order.status].push(order)
      }
    })

    return groups
  }, [orders])

  // Calculate statistics
  const stats = useMemo((): KitchenStats => {
    const activeOrders = orders.filter(o =>
      ACTIVE_STATUSES.includes(o.status)
    )

    const totalDishes = activeOrders.reduce((sum, order) =>
      sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    )

    const totalRevenue = activeOrders.reduce((sum, order) => sum + order.totalAmount, 0)

    const criticalPreferenceCount = activeOrders.filter(order =>
      order.customer.preferences?.some(p => p.type === 'ALLERGY' || p.type === 'MEDICAL')
    ).length

    const byStatus: Record<OrderStatus, number> = {
      NEW: groupedOrders.NEW.length,
      CONFIRMED: groupedOrders.CONFIRMED.length,
      PREPARING: groupedOrders.PREPARING.length,
      READY: groupedOrders.READY.length,
      DELIVERED: groupedOrders.DELIVERED.length,
      CANCELLED: groupedOrders.CANCELLED.length
    }

    // Use centralized cutoff status calculation
    const cutoffInfo = getCutoffStatus()
    const cutoffStatus = cutoffInfo.status
    const timeUntilCutoff = cutoffInfo.timeUntilCutoff

    return {
      totalOrders: activeOrders.length,
      totalDishes,
      totalRevenue,
      criticalPreferenceCount,
      byStatus,
      cutoffStatus,
      timeUntilCutoff
    }
  }, [orders, groupedOrders])

  return {
    orders,
    groupedOrders,
    stats,
    isLoading,
    error,
    isConnected,
    updateOrderStatus,
    isUpdating,
    preparationProgress,
    setPreparationProgress,
    refetch: fetchOrders
  }
}
