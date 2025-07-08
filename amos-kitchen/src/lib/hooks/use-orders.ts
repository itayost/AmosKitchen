// lib/hooks/use-orders.ts
import { useState, useEffect, useCallback } from 'react'
import type { Order, OrderFilters } from '@/lib/types/database'

interface UseOrdersResult {
    orders: Order[] | null
    isLoading: boolean
    error: Error | null
    totalCount: number
    refetch: () => void
}

export function useOrders(filters: OrderFilters): UseOrdersResult {
    const [orders, setOrders] = useState<Order[] | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [totalCount, setTotalCount] = useState(0)

    const fetchOrders = useCallback(async () => {
        console.log('Fetching orders with filters:', filters)
        try {
            setIsLoading(true)
            setError(null)

            const params = new URLSearchParams({
                search: filters.search,
                status: filters.status,
                dateRange: filters.dateRange,
                page: filters.page.toString(),
                limit: filters.limit.toString()
            })

            console.log('Calling API:', `/api/orders?${params}`)
            const response = await fetch(`/api/orders?${params}`)

            if (!response.ok) {
                const errorData = await response.text()
                console.error('API Error:', response.status, errorData)
                throw new Error(`Failed to fetch orders: ${response.status}`)
            }

            const data = await response.json()
            console.log('Received data:', data)
            setOrders(data.orders || [])
            setTotalCount(data.totalCount || 0)
        } catch (err) {
            setError(err as Error)
            console.error('Error fetching orders:', err)
            setOrders([])
            setTotalCount(0)
        } finally {
            console.log('Setting loading to false')
            setIsLoading(false)
        }
    }, [filters])

    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    return {
        orders,
        isLoading,
        error,
        totalCount,
        refetch: fetchOrders
    }
}

// Hook for single order
export function useOrder(orderId: string) {
    const [order, setOrder] = useState<Order | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchOrder = useCallback(async () => {
        if (!orderId) return

        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch(`/api/orders/${orderId}`)

            if (!response.ok) {
                throw new Error('Failed to fetch order')
            }

            const data = await response.json()
            setOrder(data)
        } catch (err) {
            setError(err as Error)
            console.error('Error fetching order:', err)
        } finally {
            setIsLoading(false)
        }
    }, [orderId])

    useEffect(() => {
        fetchOrder()
    }, [fetchOrder])

    return {
        order,
        isLoading,
        error,
        refetch: fetchOrder
    }
}

// Hook for order mutations
export function useOrderMutations() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const createOrder = async (orderData: any) => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            })

            if (!response.ok) {
                throw new Error('Failed to create order')
            }

            return await response.json()
        } catch (err) {
            setError(err as Error)
            throw err
        } finally {
            setIsLoading(false)
        }
    }

    const updateOrder = async (orderId: string, updates: any) => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })

            if (!response.ok) {
                throw new Error('Failed to update order')
            }

            return await response.json()
        } catch (err) {
            setError(err as Error)
            throw err
        } finally {
            setIsLoading(false)
        }
    }

    const deleteOrder = async (orderId: string) => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Failed to delete order')
            }

            return true
        } catch (err) {
            setError(err as Error)
            throw err
        } finally {
            setIsLoading(false)
        }
    }

    return {
        createOrder,
        updateOrder,
        deleteOrder,
        isLoading,
        error
    }
}
