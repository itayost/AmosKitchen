// lib/hooks/use-orders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import type { Order, OrderFilters } from '@/lib/types/database'

// Query keys
export const ordersQueryKey = (filters: OrderFilters) => ['orders', filters] as const
export const orderQueryKey = (orderId: string) => ['order', orderId] as const

// Fetch functions
async function fetchOrders(filters: OrderFilters): Promise<{ orders: Order[]; totalCount: number }> {
  const params = new URLSearchParams({
    search: filters.search,
    status: filters.status,
    dateRange: filters.dateRange,
    page: filters.page.toString(),
    limit: filters.limit.toString()
  })

  const response = await fetchWithAuth(`/api/orders?${params}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.status}`)
  }

  return response.json()
}

async function fetchOrder(orderId: string): Promise<Order> {
  const response = await fetchWithAuth(`/api/orders/${orderId}`)

  if (!response.ok) {
    throw new Error('Failed to fetch order')
  }

  return response.json()
}

// Orders list hook
export function useOrders(filters: OrderFilters) {
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ordersQueryKey(filters),
    queryFn: () => fetchOrders(filters),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })

  return {
    orders: data?.orders ?? null,
    isLoading,
    error: error instanceof Error ? error : null,
    totalCount: data?.totalCount ?? 0,
    refetch
  }
}

// Single order hook
export function useOrder(orderId: string) {
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: orderQueryKey(orderId),
    queryFn: () => fetchOrder(orderId),
    enabled: !!orderId,
    staleTime: 30 * 1000,
  })

  return {
    order: data ?? null,
    isLoading,
    error: error instanceof Error ? error : null,
    refetch
  }
}

// Order mutations hook
export function useOrderMutations() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetchWithAuth('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        throw new Error('Failed to create order')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate orders list queries
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['friday'] })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: string; updates: any }) => {
      const response = await fetchWithAuth(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update order')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: orderQueryKey(variables.orderId) })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['friday'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetchWithAuth(`/api/orders/${orderId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete order')
      }

      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['friday'] })
    }
  })

  return {
    createOrder: createMutation.mutateAsync,
    updateOrder: (orderId: string, updates: any) => updateMutation.mutateAsync({ orderId, updates }),
    deleteOrder: deleteMutation.mutateAsync,
    isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    error: createMutation.error || updateMutation.error || deleteMutation.error
  }
}
