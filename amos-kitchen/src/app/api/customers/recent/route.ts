// src/app/api/customers/recent/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api/auth-middleware'
import { getOrders } from '@/lib/firebase/dao/orders'
import { getCustomerById, getCustomerPreferences } from '@/lib/firebase/dao/customers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify authentication
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return auth.response
  }

  try {
    // Get limit from query params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '5')

    // Get orders from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { orders } = await getOrders({ dateRange: 'month' }, 100)

    // Count orders per customer
    const customerOrderCount = new Map<string, { count: number; lastOrderDate: Date }>()

    orders.forEach(order => {
      const existing = customerOrderCount.get(order.customerId)
      const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt)

      if (existing) {
        existing.count++
        if (orderDate > existing.lastOrderDate) {
          existing.lastOrderDate = orderDate
        }
      } else {
        customerOrderCount.set(order.customerId, {
          count: 1,
          lastOrderDate: orderDate
        })
      }
    })

    // Sort by order count (descending) and get top N
    const sortedCustomerIds = Array.from(customerOrderCount.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([customerId, stats]) => ({ customerId, ...stats }))

    // Fetch customer details and preferences in parallel
    const customersWithDetails = await Promise.all(
      sortedCustomerIds.map(async ({ customerId, count, lastOrderDate }) => {
        try {
          const customer = await getCustomerById(customerId)
          if (!customer) return null

          // Get customer preferences
          let preferences: any[] = []
          try {
            preferences = await getCustomerPreferences(customerId)
          } catch (e) {
            // Preferences are optional, don't fail if they can't be fetched
            console.warn(`Failed to fetch preferences for customer ${customerId}:`, e)
          }

          return {
            ...customer,
            preferences,
            orderCount: count,
            lastOrderDate
          }
        } catch (e) {
          console.warn(`Failed to fetch customer ${customerId}:`, e)
          return null
        }
      })
    )

    // Filter out null values (customers that couldn't be fetched)
    const validCustomers = customersWithDetails.filter(Boolean)

    return NextResponse.json(validCustomers)
  } catch (error) {
    console.error('Error fetching recent customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent customers' },
      { status: 500 }
    )
  }
}
