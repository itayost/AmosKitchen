// lib/hooks/use-settings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import type { AppSettings } from '@/lib/types/firestore'
import { DEFAULT_DELIVERY_FEE } from '@/lib/firebase/dao/settings'

export const settingsQueryKey = ['settings'] as const

async function fetchSettings(): Promise<AppSettings> {
  const response = await fetchWithAuth('/api/settings')

  if (!response.ok) {
    throw new Error('Failed to fetch settings')
  }

  return response.json()
}

export function useSettings() {
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: settingsQueryKey,
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes - settings rarely change
  })

  return {
    settings: data ?? { deliveryFee: DEFAULT_DELIVERY_FEE, updatedAt: new Date() },
    isLoading,
    error: error instanceof Error ? error : null
  }
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: { deliveryFee: number }) => {
      const response = await fetchWithAuth('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKey })
    }
  })

  return {
    updateSettings: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error
  }
}
