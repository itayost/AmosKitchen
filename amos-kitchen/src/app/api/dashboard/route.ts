// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { startOfWeek, endOfWeek, startOfDay, endOfDay, subDays, addDays } from 'date-fns'
import { getOrders, getOrderStats, getTodayOrders } from '@/lib/firebase/dao/orders'
import { getCustomers } from '@/lib/firebase/dao/customers'
import { getDishes } from '@/lib/firebase/dao/dishes'
import { query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { customersCollection, ordersCollection, dateToTimestamp } from '@/lib/firebase/firestore'
import { verifyAuth } from '@/lib/api/auth-middleware'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return auth.response
    }
    const today = new Date()
    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)
    const weekStart = startOfWeek(today, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 })
    const nextFriday = addDays(weekStart, 5)
    const lastWeekStart = subDays(weekStart, 7)

    // Today's statistics
    const todayOrdersQuery = query(
      ordersCollection,
      where('createdAt', '>=', dateToTimestamp(todayStart)),
      where('createdAt', '<=', dateToTimestamp(todayEnd))
    )
    const todayOrdersSnapshot = await getDocs(todayOrdersQuery)
    const todayOrders: any[] = []
    todayOrdersSnapshot.forEach(doc => {
      todayOrders.push({ id: doc.id, ...doc.data() })
    })

    // Count new customers today
    const newCustomersQuery = query(
      customersCollection,
      where('createdAt', '>=', dateToTimestamp(todayStart)),
      where('createdAt', '<=', dateToTimestamp(todayEnd))
    )
    const newCustomersSnapshot = await getDocs(newCustomersQuery)

    const todayStats = {
      orders: todayOrders.length,
      revenue: todayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      newCustomers: newCustomersSnapshot.size
    }

    // Week statistics
    const weekOrdersQuery = query(
      ordersCollection,
      where('deliveryDate', '>=', dateToTimestamp(weekStart)),
      where('deliveryDate', '<=', dateToTimestamp(weekEnd))
    )
    const weekOrdersSnapshot = await getDocs(weekOrdersQuery)
    const weekOrders: any[] = []
    weekOrdersSnapshot.forEach(doc => {
      weekOrders.push({ id: doc.id, ...doc.data() })
    })

    const weekStats = {
      orders: weekOrders.length,
      revenue: weekOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      pendingOrders: weekOrders.filter(o =>
        ['NEW', 'CONFIRMED', 'PREPARING'].includes(o.status)
      ).length,
      completedOrders: weekOrders.filter(o => o.status === 'DELIVERED').length
    }

    // Friday orders (upcoming)
    const fridayOrdersQuery = query(
      ordersCollection,
      where('deliveryDate', '>=', dateToTimestamp(startOfDay(nextFriday))),
      where('deliveryDate', '<=', dateToTimestamp(endOfDay(nextFriday)))
    )
    const fridayOrders: any[] = []
    try {
      const fridayOrdersSnapshot = await getDocs(fridayOrdersQuery)
      fridayOrdersSnapshot.forEach(doc => {
        fridayOrders.push({ id: doc.id, ...doc.data() })
      })
    } catch (error: any) {
      if (error?.code !== 'permission-denied') {
        console.error('Failed to fetch Friday orders:', error)
      }
    }

    const fridayStats = {
      orders: fridayOrders.length,
      revenue: fridayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      dishes: fridayOrders.reduce((sum, order) =>
        sum + (order.items ? order.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) : 0), 0
      )
    }

    // Recent orders
    const recentOrdersQuery = query(
      ordersCollection,
      orderBy('createdAt', 'desc'),
      limit(10)
    )
    const recentOrdersSnapshot = await getDocs(recentOrdersQuery)
    const recentOrders: any[] = []
    recentOrdersSnapshot.forEach(doc => {
      const order = { id: doc.id, ...doc.data() }
      // Include customer data from denormalized field
      recentOrders.push({
        ...order,
        customer: order.customerData || { name: 'Unknown', phone: '' },
        orderItems: order.items || []
      })
    })

    // Recent activity - we'll just use recent orders for now
    // In a real app, you might want to track activities separately
    const recentActivity = recentOrders.map(order => ({
      id: order.id,
      action: 'ORDER_CREATED',
      createdAt: order.createdAt,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer
      }
    }))

    // Top dishes this week - manual aggregation with revenue
    const dishCounts = new Map<string, { dish: any, quantity: number, orderCount: number, revenue: number }>()

    weekOrders.forEach(order => {
      if (order.items) {
        order.items.forEach((item: any) => {
          const existing = dishCounts.get(item.dishId) || {
            dish: { id: item.dishId, name: item.dishName || 'Unknown' },
            quantity: 0,
            orderCount: 0,
            revenue: 0
          }
          existing.quantity += item.quantity
          existing.orderCount += 1
          existing.revenue += (item.price || 0) * item.quantity
          dishCounts.set(item.dishId, existing)
        })
      }
    })

    // Get dish details for top dishes
    const topDishEntries = Array.from(dishCounts.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue) // Sort by revenue instead of quantity
      .slice(0, 5)

    const dishIds = topDishEntries.map(([id]) => id)
    const allDishes = await getDishes()
    const dishMap = new Map(allDishes.map(d => [d.id, d]))

    const topDishes = topDishEntries.map(([dishId, stats]) => ({
      dish: dishMap.get(dishId) || stats.dish,
      quantity: stats.quantity,
      orderCount: stats.orderCount,
      revenue: stats.revenue,
      name: (dishMap.get(dishId) || stats.dish).name // Add name for easier display
    }))


    // Customer insights
    const allCustomersSnapshot = await getDocs(customersCollection)
    const totalCustomers = allCustomersSnapshot.size

    // Active customers (with orders in last 30 days)
    const thirtyDaysAgo = subDays(today, 30)
    const activeCustomerIds = new Set<string>()

    const activeOrdersQuery = query(
      ordersCollection,
      where('createdAt', '>=', dateToTimestamp(thirtyDaysAgo))
    )
    const activeOrdersSnapshot = await getDocs(activeOrdersQuery)
    activeOrdersSnapshot.forEach(doc => {
      const order = doc.data()
      if (order.customerId) {
        activeCustomerIds.add(order.customerId)
      }
    })

    const activeCustomers = activeCustomerIds.size

    // Chart data - last 7 days
    const chartData = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)

      const dayOrdersQuery = query(
        ordersCollection,
        where('createdAt', '>=', dateToTimestamp(dayStart)),
        where('createdAt', '<=', dateToTimestamp(dayEnd))
      )
      const dayOrdersSnapshot = await getDocs(dayOrdersQuery)
      const dayOrders: any[] = []
      dayOrdersSnapshot.forEach(doc => {
        dayOrders.push(doc.data())
      })

      chartData.push({
        date: date.toISOString(),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0)
      })
    }

    // Comparison with last week
    const lastWeekOrdersQuery = query(
      ordersCollection,
      where('deliveryDate', '>=', dateToTimestamp(lastWeekStart)),
      where('deliveryDate', '<', dateToTimestamp(weekStart))
    )
    const lastWeekOrdersSnapshot = await getDocs(lastWeekOrdersQuery)
    const lastWeekOrders: any[] = []
    lastWeekOrdersSnapshot.forEach(doc => {
      lastWeekOrders.push(doc.data())
    })

    const lastWeekRevenue = lastWeekOrders.reduce((sum, order) =>
      sum + order.totalAmount, 0
    )

    const comparison = {
      revenueChange: weekStats.revenue - lastWeekRevenue,
      revenueChangePercent: lastWeekRevenue > 0
        ? ((weekStats.revenue - lastWeekRevenue) / lastWeekRevenue * 100).toFixed(1)
        : 0,
      ordersChange: weekStats.orders - lastWeekOrders.length,
      ordersChangePercent: lastWeekOrders.length > 0
        ? ((weekStats.orders - lastWeekOrders.length) / lastWeekOrders.length * 100).toFixed(1)
        : 0
    }

    // Additional KPIs
    const averageOrderValue = weekStats.orders > 0
      ? weekStats.revenue / weekStats.orders
      : 0

    // Order fulfillment rate (delivered vs cancelled)
    const deliveredOrders = weekOrders.filter(o => o.status === 'DELIVERED').length
    const cancelledOrders = weekOrders.filter(o => o.status === 'CANCELLED').length
    const fulfillmentRate = weekOrders.length > 0
      ? (deliveredOrders / weekOrders.length) * 100
      : 0

    // Category breakdown
    const categoryBreakdown = new Map<string, { quantity: number, revenue: number }>()

    dishCounts.forEach((stats, dishId) => {
      const dish = dishMap.get(dishId)
      const category = dish?.category || 'uncategorized'
      const existing = categoryBreakdown.get(category) || { quantity: 0, revenue: 0 }
      existing.quantity += stats.quantity
      existing.revenue += stats.revenue
      categoryBreakdown.set(category, existing)
    })

    // Peak ordering days
    const ordersByDayOfWeek = new Map<string, number>()
    weekOrders.forEach(order => {
      if (order.deliveryDate) {
        const date = order.deliveryDate.toDate ? order.deliveryDate.toDate() : new Date(order.deliveryDate)
        const dayName = date.toLocaleDateString('he-IL', { weekday: 'long' })
        ordersByDayOfWeek.set(dayName, (ordersByDayOfWeek.get(dayName) || 0) + 1)
      }
    })

    // Sort peak days
    const peakDays = Array.from(ordersByDayOfWeek.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([day, count]) => ({ day, count }))

    return NextResponse.json({
      today: todayStats,
      week: {
        ...weekStats,
        averageOrderValue,
        fulfillmentRate,
        cancelledOrders
      },
      friday: fridayStats,
      recentOrders,
      recentActivity,
      topDishes,
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        retention: totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0
      },
      chartData,
      comparison,
      categoryBreakdown: Array.from(categoryBreakdown.entries()).map(([category, stats]) => ({
        category,
        ...stats
      })),
      peakDays,
      kpis: {
        averageOrderValue,
        fulfillmentRate,
        customerRetention: totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0,
        weekOverWeekGrowth: parseFloat(comparison.revenueChangePercent as any) || 0
      }
    })
  } catch (error: any) {
    // Suppress Firebase permission errors during build
    if (error?.code !== 'permission-denied') {
      console.error('Error fetching dashboard data:', error)
    }
    // Return empty data instead of error during build
    if (error?.code === 'permission-denied') {
      return NextResponse.json({
        today: { orders: 0, revenue: 0, newCustomers: 0 },
        week: { orders: 0, revenue: 0, pendingOrders: 0, completedOrders: 0 },
        friday: { orders: 0, revenue: 0, dishes: 0 },
        recentOrders: [],
        recentActivity: [],
        topDishes: [],
        customers: { total: 0, active: 0 },
        chartData: [],
        comparison: { revenueChange: 0, revenueChangePercent: 0, ordersChange: 0, ordersChangePercent: 0 }
      })
    }
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
