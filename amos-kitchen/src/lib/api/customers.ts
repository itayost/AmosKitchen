// lib/api/customers.ts
import { useState, useEffect, useCallback } from 'react'
import { Customer, CustomerPreference, CreateCustomerInput, UpdateCustomerInput } from '@/lib/types/database'

// Base API function with error handling
async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'API request failed')
  }

  return response.json()
}

// Customer API functions
export const customersApi = {
  // Get all customers with preferences
  async getAll(search?: string) {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    
    return apiRequest<Customer[]>(`/api/customers${params.toString() ? `?${params}` : ''}`)
  },

  // Get single customer with preferences and stats
  async getById(id: string) {
    return apiRequest<Customer & { 
      orderCount: number
      totalSpent: number
      favoriteDishes: Array<{ dishId: string; dishName: string; totalOrdered: number }>
    }>(`/api/customers/${id}`)
  },

  // Create customer with preferences
  async create(data: CreateCustomerInput) {
    return apiRequest<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Update customer (with optional preferences update)
  async update(id: string, data: UpdateCustomerInput) {
    return apiRequest<Customer>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Delete customer
  async delete(id: string) {
    return apiRequest<{ message: string; deletedPreferences: number }>(`/api/customers/${id}`, {
      method: 'DELETE',
    })
  },

  // Preferences-specific operations
  preferences: {
    // Get all preferences for a customer
    async getAll(customerId: string) {
      return apiRequest<CustomerPreference[]>(`/api/customers/${customerId}/preferences`)
    },

    // Add a single preference
    async add(customerId: string, preference: Omit<CustomerPreference, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>) {
      return apiRequest<CustomerPreference>(`/api/customers/${customerId}/preferences`, {
        method: 'POST',
        body: JSON.stringify(preference),
      })
    },

    // Update a preference
    async update(customerId: string, preferenceId: string, data: Partial<Omit<CustomerPreference, 'id' | 'customerId'>>) {
      return apiRequest<CustomerPreference>(`/api/customers/${customerId}/preferences`, {
        method: 'PUT',
        body: JSON.stringify({ preferenceId, ...data }),
      })
    },

    // Delete a preference
    async delete(customerId: string, preferenceId: string) {
      return apiRequest<{ message: string }>(`/api/customers/${customerId}/preferences?preferenceId=${preferenceId}`, {
        method: 'DELETE',
      })
    },
  },
}

// React hooks for customer data
export function useCustomers(search?: string) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await customersApi.getAll(search)
      setCustomers(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  return { customers, loading, error, refetch: fetchCustomers }
}

export function useCustomer(id: string) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomer = useCallback(async () => {
    if (!id) return
    
    try {
      setLoading(true)
      const data = await customersApi.getById(id)
      setCustomer(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customer')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  return { customer, loading, error, refetch: fetchCustomer }
}

// Helper function to check if customer has critical preferences
export function hasCriticalPreferences(customer: Customer): boolean {
  if (!customer.preferences) return false
  
  return customer.preferences.some(pref => 
    pref.type === 'ALLERGY' || pref.type === 'MEDICAL'
  )
}

// Helper function to get preference summary
export function getPreferenceSummary(customer: Customer): string {
  if (!customer.preferences || customer.preferences.length === 0) return ''
  
  const byType = customer.preferences.reduce((acc, pref) => {
    if (!acc[pref.type]) acc[pref.type] = []
    acc[pref.type].push(pref.value)
    return acc
  }, {} as Record<string, string[]>)
  
  const parts: string[] = []
  if (byType.ALLERGY) parts.push(`אלרגיות: ${byType.ALLERGY.join(', ')}`)
  if (byType.MEDICAL) parts.push(`רפואי: ${byType.MEDICAL.join(', ')}`)
  if (byType.DIETARY_RESTRICTION) parts.push(`הגבלות: ${byType.DIETARY_RESTRICTION.join(', ')}`)
  if (byType.PREFERENCE) parts.push(`העדפות: ${byType.PREFERENCE.join(', ')}`)
  
  return parts.join(' | ')
}
