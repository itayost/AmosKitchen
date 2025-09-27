// src/app/api/reports/weekly-summary/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { startOfWeek, endOfWeek, addDays } from 'date-fns'
import { query, where, getDocs, orderBy } from 'firebase/firestore'
import { ordersCollection, dateToTimestamp } from '@/lib/firebase/firestore'
import { getDishesByIds } from '@/lib/firebase/dao/dishes'
import { getCustomerById } from '@/lib/firebase/dao/customers'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const date = searchParams.get('date') || new Date().toISOString()

        // Get the Friday of the selected week
        const selectedDate = new Date(date)
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 }) // Sunday
        const friday = addDays(weekStart, 5)
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 })

        // Fetch all orders for the week from Firestore
        const ordersQuery = query(
            ordersCollection,
            where('deliveryDate', '>=', dateToTimestamp(weekStart)),
            where('deliveryDate', '<=', dateToTimestamp(weekEnd)),
            orderBy('deliveryDate', 'asc')
        )

        const ordersSnapshot = await getDocs(ordersQuery)
        const orders: any[] = []
        const dishIds = new Set<string>()
        const customerIds = new Set<string>()

        ordersSnapshot.forEach(doc => {
            const order = { id: doc.id, ...doc.data() }
            orders.push(order)

            // Collect dish IDs
            if (order.items) {
                order.items.forEach((item: any) => dishIds.add(item.dishId))
            }

            // Collect customer ID if no denormalized data
            if (!order.customerData && order.customerId) {
                customerIds.add(order.customerId)
            }
        })

        // Fetch dish and customer details
        const dishes = await getDishesByIds(Array.from(dishIds))
        const dishMap = new Map(dishes.map(d => [d.id, d]))

        const customerMap = new Map()
        for (const customerId of Array.from(customerIds)) {
            const customer = await getCustomerById(customerId)
            if (customer) {
                customerMap.set(customerId, customer)
            }
        }

        // Transform orders with full details
        orders.forEach(order => {
            order.customer = order.customerData || customerMap.get(order.customerId) || { name: 'Unknown' }
            order.orderItems = order.items?.map((item: any) => ({
                ...item,
                dish: dishMap.get(item.dishId) || { name: item.dishName || 'Unknown Dish' }
            })) || []
            // Convert totalAmount to number if needed
            order.totalAmount = Number(order.totalAmount) || 0
        })

        // Calculate statistics
        const totalOrders = orders.length
        const totalRevenue = orders.reduce((sum, order) =>
            sum + Number(order.totalAmount), 0
        )
        const uniqueCustomers = new Set(orders.map(o => o.customerId)).size

        // Orders by status
        const ordersByStatus = orders.reduce((acc, order) => {
            const status = order.status.toLowerCase()
            acc[status] = (acc[status] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        // Orders by day
        const ordersByDay = orders.reduce((acc, order) => {
            const deliveryDate = order.deliveryDate?.toDate ? order.deliveryDate.toDate() : new Date(order.deliveryDate)
            const day = deliveryDate.toISOString().split('T')[0]
            if (!acc[day]) {
                acc[day] = {
                    date: day,
                    count: 0,
                    revenue: 0,
                    dishes: {} as Record<string, number>
                }
            }
            acc[day].count++
            acc[day].revenue += Number(order.totalAmount)

            // Count dishes per day
            order.orderItems.forEach((item: any) => {
                const dishName = item.dish.name
                acc[day].dishes[dishName] = (acc[day].dishes[dishName] || 0) + item.quantity
            })

            return acc
        }, {} as Record<string, any>)

        // Calculate dish popularity
        const dishStats = new Map<string, {
            dish: any
            quantity: number
            revenue: number
            orderCount: number
        }>()

        orders.forEach(order => {
            order.orderItems.forEach((item: any) => {
                const dishId = item.dishId
                const existing = dishStats.get(dishId) || {
                    dish: item.dish,
                    quantity: 0,
                    revenue: 0,
                    orderCount: 0
                }
                existing.quantity += item.quantity
                existing.revenue += (item.price || 0) * item.quantity
                existing.orderCount += 1
                dishStats.set(dishId, existing)
            })
        })

        const topDishes = Array.from(dishStats.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10)

        // Note: Ingredient requirements removed as ingredients are no longer in the system

        // Customer analysis
        const customerStats = new Map<string, {
            customer: any
            orderCount: number
            totalSpent: number
            dishes: Map<string, number>
        }>()

        orders.forEach(order => {
            const customerId = order.customerId
            const existing = customerStats.get(customerId) || {
                customer: order.customer,
                orderCount: 0,
                totalSpent: 0,
                dishes: new Map<string, number>()
            }
            existing.orderCount++
            existing.totalSpent += order.totalAmount || 0

            order.orderItems.forEach((item: any) => {
                const count = existing.dishes.get(item.dish.name) || 0
                existing.dishes.set(item.dish.name, count + item.quantity)
            })

            customerStats.set(customerId, existing)
        })

        const topCustomers = Array.from(customerStats.values())
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10)
            .map(stat => ({
                ...stat,
                favoritesDishes: Array.from(stat.dishes.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([dish, count]) => ({ dish, count }))
            }))

        return NextResponse.json({
            weekOf: weekStart.toISOString(),
            friday: friday.toISOString(),
            summary: {
                totalOrders,
                totalRevenue,
                uniqueCustomers,
                averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                ordersByStatus,
                ordersByDay: Object.values(ordersByDay)
            },
            topDishes,
            topCustomers,
            orders: orders.map(order => ({
                ...order,
                totalAmount: order.totalAmount || 0
            }))
        })
    } catch (error) {
        console.error('Error generating weekly summary:', error)
        return NextResponse.json(
            { error: 'Failed to generate weekly summary' },
            { status: 500 }
        )
    }
}
