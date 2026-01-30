'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import type { Customer, CustomerPreference } from '@/lib/types/database'

export interface RecentCustomer extends Customer {
  preferences?: CustomerPreference[]
  orderCount: number
  lastOrderDate?: Date
}

async function fetchRecentCustomers(limit: number): Promise<RecentCustomer[]> {
  const response = await fetchWithAuth(`/api/customers/recent?limit=${limit}`)

  if (!response.ok) {
    throw new Error('Failed to fetch recent customers')
  }

  return response.json()
}

export const recentCustomersQueryKey = (limit: number) => ['customers', 'recent', limit] as const

export function useRecentCustomers(limit: number = 5) {
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: recentCustomersQueryKey(limit),
    queryFn: () => fetchRecentCustomers(limit),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  })

  return {
    recentCustomers: data ?? [],
    isLoading,
    error: error instanceof Error ? error : null,
    refetch
  }
}
