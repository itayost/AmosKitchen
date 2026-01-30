// lib/hooks/use-friday-data.ts
import { useQuery } from '@tanstack/react-query'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import { FRIDAY_DATA_REFRESH_INTERVAL_MS } from '@/lib/constants/friday'

export type FridayStatus = 'open' | 'cutoff-soon' | 'closed'

export interface FridayData {
  date: Date
  orderCount: number
  dishCount: number
  revenue: number
  status: FridayStatus
}

async function fetchFridayData(): Promise<FridayData> {
  const response = await fetchWithAuth('/api/friday')

  if (!response.ok) {
    throw new Error(`Failed to fetch Friday data: ${response.status}`)
  }

  const json = await response.json()
  return {
    ...json,
    date: new Date(json.date)
  }
}

export const fridayQueryKey = ['friday'] as const

export function useFridayData() {
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: fridayQueryKey,
    queryFn: fetchFridayData,
    staleTime: FRIDAY_DATA_REFRESH_INTERVAL_MS,
    refetchInterval: FRIDAY_DATA_REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  })

  return {
    data: data ?? null,
    isLoading,
    error: error instanceof Error ? error : null,
    refetch
  }
}
