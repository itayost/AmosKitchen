// src/app/api/orders/today/route.ts
import { NextResponse } from 'next/server'
import { getTodayOrders } from '@/lib/firebase/dao/orders'
import { getDishesByIds } from '@/lib/firebase/dao/dishes'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get today's orders from Firestore
    const orders = await getTodayOrders()

    // Filter out cancelled orders
    const activeOrders = orders.filter(order => order.status !== 'CANCELLED')

    // Get all unique dish IDs
    const dishIds = new Set<string>()
    activeOrders.forEach(order => {
      order.items.forEach(item => dishIds.add(item.dishId))
    })

    // Fetch dish details
    const dishes = await getDishesByIds(Array.from(dishIds))
    const dishMap = new Map(dishes.map(d => [d.id, d]))

    // Transform orders to match frontend expectations
    const transformedOrders = activeOrders.map(order => ({
      ...order,
      customer: order.customerData || {
        id: order.customerId,
        name: 'Unknown',
        phone: '',
        email: null,
        address: null,
        notes: null
      },
      orderItems: order.items.map(item => ({
        ...item,
        dish: dishMap.get(item.dishId) || {
          id: item.dishId,
          name: item.dishName || 'Unknown Dish',
          category: 'MAIN',
          price: item.price,
          description: null
        }
      }))
    }))

    // Sort by status and creation date
    transformedOrders.sort((a, b) => {
      // Status order: NEW, CONFIRMED, PREPARING, READY, DELIVERED
      const statusOrder = ['NEW', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED']
      const statusDiff = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
      if (statusDiff !== 0) return statusDiff
      return a.createdAt < b.createdAt ? -1 : 1
    })

    // Return the array directly as the component expects
    return NextResponse.json(transformedOrders)
  } catch (error: any) {
    // Suppress Firebase permission errors during build
    if (error?.code !== 'permission-denied') {
      console.error('Failed to fetch Friday orders:', error)

      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
    }

    // Return empty array on error to prevent component crashes
    return NextResponse.json([], { status: 500 })
  }
}
