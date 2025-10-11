// src/app/api/orders/next-delivery/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrdersForNextDeliveryDay } from '@/lib/firebase/dao/orders'
import { getDishesByIds } from '@/lib/firebase/dao/dishes'
import { getCustomerById } from '@/lib/firebase/dao/customers'
import { verifyAuth } from '@/lib/api/auth-middleware'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return auth.response
    }

    // Get orders for the next delivery day from Firestore
    const { orders, deliveryDate } = await getOrdersForNextDeliveryDay()

    // Filter out cancelled orders
    const activeOrders = orders.filter(order => order.status !== 'CANCELLED')

    // Get all unique dish IDs and customer IDs
    const dishIds = new Set<string>()
    const customerIds = new Set<string>()

    activeOrders.forEach(order => {
      customerIds.add(order.customerId)
      order.items.forEach(item => dishIds.add(item.dishId))
    })

    // Fetch dish details
    const dishes = await getDishesByIds(Array.from(dishIds))
    const dishMap = new Map(dishes.map(d => [d.id, d]))

    // Fetch customer details with preferences
    const customerPromises = Array.from(customerIds).map(id => getCustomerById(id))
    const customers = await Promise.all(customerPromises)
    const customerMap = new Map(customers.filter(c => c).map(c => [c!.id, c]))

    // Transform orders to match frontend expectations
    const transformedOrders = activeOrders.map(order => {
      const customer = customerMap.get(order.customerId)

      return {
        ...order,
        customer: {
          id: order.customerId,
          name: order.customerData?.name || customer?.name || 'Unknown',
          phone: order.customerData?.phone || customer?.phone || '',
          email: order.customerData?.email || customer?.email || null,
          address: customer?.address || null,
          notes: customer?.notes || null,
          preferences: customer?.preferences || []
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
      }
    })

    // Sort by status and creation date
    transformedOrders.sort((a, b) => {
      const statusOrder = ['NEW', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED']
      const statusDiff = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
      if (statusDiff !== 0) return statusDiff
      return a.createdAt < b.createdAt ? -1 : 1
    })

    // Return orders with delivery date
    return NextResponse.json({
      orders: transformedOrders,
      deliveryDate: deliveryDate ? deliveryDate.toISOString() : null
    })
  } catch (error: any) {
    // Suppress Firebase permission errors during build
    if (error?.code !== 'permission-denied') {
      console.error('Failed to fetch next delivery orders:', error)

      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
    }

    // Return empty array on error to prevent component crashes
    return NextResponse.json({ orders: [], deliveryDate: null }, { status: 500 })
  }
}