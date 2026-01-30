'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import type { Order, Dish, Customer, CustomerPreference } from '@/lib/types/database'
import type { OrderItemInput, CustomerWithPreferences } from '@/contexts/order-wizard-context'

interface SkippedItem {
  dishName: string
  quantity: number
  reason: string
}

interface DuplicateOrderResult {
  customer: CustomerWithPreferences | null
  items: OrderItemInput[]
  notes: string
  skippedItems: SkippedItem[]
  warnings: string[]
  isLoading: boolean
  error: Error | null
}

interface UseDuplicateOrderParams {
  orderId?: string | null
  availableDishes: Dish[]
}

export function useDuplicateOrder({ orderId, availableDishes }: UseDuplicateOrderParams): DuplicateOrderResult {
  const [customer, setCustomer] = useState<CustomerWithPreferences | null>(null)
  const [items, setItems] = useState<OrderItemInput[]>([])
  const [notes, setNotes] = useState('')
  const [skippedItems, setSkippedItems] = useState<SkippedItem[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchAndDuplicate = useCallback(async () => {
    if (!orderId) return

    try {
      setIsLoading(true)
      setError(null)
      setSkippedItems([])
      setWarnings([])

      // Fetch the original order
      const response = await fetchWithAuth(`/api/orders/${orderId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch order for duplication')
      }

      const order = await response.json() as Order & {
        customer: Customer & { preferences?: CustomerPreference[] }
        items?: any[] // API might return items instead of orderItems
      }

      // Set customer with preferences
      const customerWithPrefs: CustomerWithPreferences = {
        ...order.customer,
        preferences: order.customer.preferences || []
      }
      setCustomer(customerWithPrefs)

      // Process order items - filter out unavailable dishes
      // API might return as 'items' or 'orderItems'
      const validItems: OrderItemInput[] = []
      const skipped: SkippedItem[] = []

      const orderItems = order.orderItems || order.items || []

      orderItems.forEach((item: any) => {
        const dish = availableDishes.find(d => d.id === item.dishId)

        if (!dish) {
          // Dish no longer exists
          skipped.push({
            dishName: item.dish?.name || item.dishName || 'מנה לא ידועה',
            quantity: item.quantity,
            reason: 'המנה כבר לא קיימת בתפריט'
          })
        } else if (!dish.isAvailable) {
          // Dish exists but is not available
          skipped.push({
            dishName: dish.name,
            quantity: item.quantity,
            reason: 'המנה לא זמינה כרגע'
          })
        } else {
          // Dish is available - add to valid items
          validItems.push({
            dishId: item.dishId,
            quantity: item.quantity,
            price: dish.price, // Use current price
            notes: item.notes || ''
          })
        }
      })

      setItems(validItems)
      setSkippedItems(skipped)

      // Generate warnings
      const newWarnings: string[] = []
      if (skipped.length > 0) {
        newWarnings.push(`${skipped.length} מנות הוסרו מההזמנה כי אינן זמינות`)
      }
      if (validItems.length === 0) {
        newWarnings.push('כל המנות מההזמנה המקורית אינן זמינות. יש לבחור מנות חדשות.')
      }
      setWarnings(newWarnings)

      // Set notes (without original order-specific notes, but keep preference warnings)
      const preferenceNotes = customerWithPrefs.preferences
        ?.filter(p => p.type === 'ALLERGY' || p.type === 'MEDICAL')
        .map(p => `${p.type === 'ALLERGY' ? 'אלרגיה' : 'רפואי'} - ${p.value}`)
        .join(', ')

      if (preferenceNotes) {
        setNotes(`⚠️ שים לב: ${preferenceNotes}`)
      } else {
        setNotes('')
      }

    } catch (err) {
      console.error('Error duplicating order:', err)
      setError(err instanceof Error ? err : new Error('Failed to duplicate order'))
    } finally {
      setIsLoading(false)
    }
  }, [orderId, availableDishes])

  const dishesLoaded = availableDishes.length > 0

  useEffect(() => {
    if (orderId && dishesLoaded) {
      fetchAndDuplicate()
    }
  }, [orderId, dishesLoaded, fetchAndDuplicate])

  return {
    customer,
    items,
    notes,
    skippedItems,
    warnings,
    isLoading,
    error
  }
}
