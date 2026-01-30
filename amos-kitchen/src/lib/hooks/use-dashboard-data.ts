// lib/hooks/use-dashboard-data.ts
import { useQuery } from '@tanstack/react-query'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'

interface DashboardData {
  stats: {
    totalOrders: number
    activeCustomers: number
    revenue: number
    avgOrderValue: number
  }
  weeklyOrders: Array<{ day: string; orders: number }>
  topDishes: Array<{ name: string; count: number }>
  recentOrders: Array<{
    id: string
    customer: string
    amount: number
    status: string
    time: string
  }>
}

async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetchWithAuth('/api/dashboard')

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data')
  }

  return response.json()
}

export const dashboardQueryKey = ['dashboard'] as const

export function useDashboardData() {
  const {
    data,
    isLoading,
    error,
    isFetching: isRefreshing,
    refetch
  } = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboardData,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
  })

  const refresh = () => {
    refetch()
  }

  return {
    data: data ?? null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'An error occurred') : null,
    isRefreshing: isRefreshing && !isLoading,
    refresh
  }
}
