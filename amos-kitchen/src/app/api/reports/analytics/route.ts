// src/app/api/reports/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfQuarter, endOfQuarter, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns'
import { query, where, getDocs, orderBy } from 'firebase/firestore'
import { ordersCollection, customersCollection, dateToTimestamp } from '@/lib/firebase/firestore'
import { getDishesByIds } from '@/lib/firebase/dao/dishes'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const period = searchParams.get('period') || 'month'

        // Calculate date ranges based on period
        const now = new Date()
        let startDate: Date
        let endDate: Date
        let previousStartDate: Date
        let previousEndDate: Date

        switch (period) {
            case 'year':
                startDate = startOfYear(now)
                endDate = endOfYear(now)
                previousStartDate = startOfYear(subMonths(now, 12))
                previousEndDate = endOfYear(subMonths(now, 12))
                break
            case 'quarter':
                startDate = startOfQuarter(now)
                endDate = endOfQuarter(now)
                previousStartDate = startOfQuarter(subMonths(now, 3))
                previousEndDate = endOfQuarter(subMonths(now, 3))
                break
            default: // month
                startDate = startOfMonth(now)
                endDate = endOfMonth(now)
                previousStartDate = startOfMonth(subMonths(now, 1))
                previousEndDate = endOfMonth(subMonths(now, 1))
        }

        // Fetch current period orders from Firestore
        const currentOrdersQuery = query(
            ordersCollection,
            where('orderDate', '>=', dateToTimestamp(startDate)),
            where('orderDate', '<=', dateToTimestamp(endDate))
        )
        const currentOrdersSnapshot = await getDocs(currentOrdersQuery)
        const orders: any[] = []
        const dishIds = new Set<string>()

        currentOrdersSnapshot.forEach(doc => {
            const order = { id: doc.id, ...doc.data() }
            if (order.status !== 'CANCELLED') {
                orders.push(order)
                // Collect dish IDs
                if (order.items) {
                    order.items.forEach((item: any) => dishIds.add(item.dishId))
                }
            }
        })

        // Fetch all customers
        const customersSnapshot = await getDocs(customersCollection)
        const customers: any[] = []
        customersSnapshot.forEach(doc => {
            customers.push({ id: doc.id, ...doc.data() })
        })

        // Add order data to customers
        const customersWithOrders = customers.map(customer => ({
            ...customer,
            orders: orders.filter(o => o.customerId === customer.id)
        }))

        // Fetch previous period orders for comparison
        const previousOrdersQuery = query(
            ordersCollection,
            where('orderDate', '>=', dateToTimestamp(previousStartDate)),
            where('orderDate', '<=', dateToTimestamp(previousEndDate))
        )
        const previousOrdersSnapshot = await getDocs(previousOrdersQuery)
        const previousOrders: any[] = []
        previousOrdersSnapshot.forEach(doc => {
            const order = doc.data()
            if (order.status !== 'CANCELLED') {
                previousOrders.push(order)
            }
        })

        // Fetch dish details
        const dishes = await getDishesByIds(Array.from(dishIds))
        const dishMap = new Map(dishes.map(d => [d.id, d]))

        // Add dish details to orders
        orders.forEach(order => {
            if (order.items) {
                order.orderItems = order.items.map((item: any) => ({
                    ...item,
                    dish: dishMap.get(item.dishId) || {
                        name: item.dishName || 'Unknown',
                        category: 'MAIN'
                    }
                }))
            } else {
                order.orderItems = []
            }
            // Add customer data if denormalized
            order.customer = order.customerData || customersWithOrders.find(c => c.id === order.customerId)
        })

        // Calculate summary metrics
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
        const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
        const revenueGrowth = previousRevenue > 0
            ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
            : 0

        const totalOrders = orders.length
        const previousOrderCount = previousOrders.length
        const ordersGrowth = previousOrderCount > 0
            ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100
            : 0

        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

        // Customer metrics
        const activeCustomers = customersWithOrders.filter(c => c.orders.length > 0)
        const newCustomers = activeCustomers.filter(c => {
            const firstOrderDate = new Date(c.createdAt)
            return firstOrderDate >= startDate && firstOrderDate <= endDate
        })
        const returningCustomers = activeCustomers.filter(c => c.orders.length > 1)

        // Revenue by time period
        const revenueByDay = calculateRevenueByPeriod(orders, 'day', startDate, endDate)
        const revenueByWeek = calculateRevenueByPeriod(orders, 'week', startDate, endDate)
        const revenueByMonth = calculateRevenueByPeriod(orders, 'month', startDate, endDate)

        // Orders by status
        const ordersByStatus = orders.reduce((acc, order) => {
            const status = order.status.toLowerCase()
            acc[status] = (acc[status] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        // Orders by day of week
        const ordersByDay = orders.reduce((acc, order) => {
            const day = format(new Date(order.deliveryDate), 'EEEE')
            acc[day] = (acc[day] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        // Top dishes
        const dishStats = new Map<string, { name: string; quantity: number; revenue: number; category: string }>()

        orders.forEach(order => {
            order.orderItems.forEach((item: any) => {
                const dishId = item.dishId
                const existing = dishStats.get(dishId) || {
                    name: item.dish.name,
                    quantity: 0,
                    revenue: 0,
                    category: item.dish.category
                }
                existing.quantity += item.quantity
                existing.revenue += (item.price || 0) * item.quantity
                dishStats.set(dishId, {
                    ...existing,
                    category: existing.category || 'uncategorized'
                })
            })
        })

        const topDishes = Array.from(dishStats.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)

        // Dishes by category
        const dishesByCategory = Array.from(dishStats.values()).reduce((acc, dish) => {
            const category = dish.category.toLowerCase()
            if (!acc[category]) {
                acc[category] = { quantity: 0, revenue: 0 }
            }
            acc[category].quantity += dish.quantity
            acc[category].revenue += dish.revenue
            return acc
        }, {} as Record<string, { quantity: number; revenue: number }>)

        // Customer analytics
        const customerStats = activeCustomers.map(customer => {
            const customerOrders = orders.filter(o => o.customerId === customer.id)
            const totalSpent = customerOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
            return {
                id: customer.id,
                name: customer.name,
                totalSpent,
                orderCount: customerOrders.length
            }
        })

        const topSpenders = customerStats
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10)

        // Customer distribution by order count
        const customersByOrderCount = customerStats.reduce((acc, customer) => {
            let range: string
            if (customer.orderCount === 1) range = '1 הזמנה'
            else if (customer.orderCount <= 3) range = '2-3 הזמנות'
            else if (customer.orderCount <= 5) range = '4-5 הזמנות'
            else range = '6+ הזמנות'

            acc[range] = (acc[range] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const response = {
            summary: {
                totalRevenue,
                totalOrders,
                averageOrderValue,
                totalCustomers: activeCustomers.length,
                newCustomers: newCustomers.length,
                returningCustomers: returningCustomers.length,
                revenueGrowth,
                ordersGrowth
            },
            revenue: {
                daily: revenueByDay,
                weekly: revenueByWeek,
                monthly: revenueByMonth
            },
            orders: {
                byStatus: ordersByStatus,
                byDay: Object.entries(ordersByDay).map(([day, count]) => ({ day, count })),
                byHour: [] // You can implement hourly distribution if needed
            },
            dishes: {
                topSelling: topDishes,
                byCategory: dishesByCategory
            },
            customers: {
                byOrderCount: Object.entries(customersByOrderCount).map(([range, count]) => ({ range, count })),
                topSpenders
            }
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Error generating analytics:', error)
        return NextResponse.json(
            { error: 'Failed to generate analytics' },
            { status: 500 }
        )
    }
}

// Helper function to calculate revenue by time period
function calculateRevenueByPeriod(
    orders: any[],
    periodType: 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date
) {
    const intervals = periodType === 'day'
        ? eachDayOfInterval({ start: startDate, end: endDate })
        : periodType === 'week'
            ? eachWeekOfInterval({ start: startDate, end: endDate })
            : eachMonthOfInterval({ start: startDate, end: endDate })

    return intervals.map(interval => {
        const periodStart = interval
        const periodEnd = periodType === 'day'
            ? interval
            : periodType === 'week'
                ? new Date(interval.getTime() + 6 * 24 * 60 * 60 * 1000)
                : endOfMonth(interval)

        const periodOrders = orders.filter(order => {
            const orderDate = order.orderDate?.toDate ? order.orderDate.toDate() : new Date(order.orderDate)
            return orderDate >= periodStart && orderDate <= periodEnd
        })

        const amount = periodOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)

        return {
            date: format(interval, periodType === 'month' ? 'MMM yyyy' : 'dd/MM'),
            amount
        }
    })
}
