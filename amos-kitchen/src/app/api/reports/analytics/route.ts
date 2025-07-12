// src/app/api/reports/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfQuarter, endOfQuarter, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns'

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

        // Fetch current period data
        const [orders, customers, previousOrders] = await Promise.all([
            // Current period orders
            prisma.order.findMany({
                where: {
                    orderDate: {
                        gte: startDate,
                        lte: endDate
                    },
                    status: {
                        not: 'CANCELLED'
                    }
                },
                include: {
                    customer: true,
                    orderItems: {
                        include: {
                            dish: true
                        }
                    }
                }
            }),

            // All customers
            prisma.customer.findMany({
                include: {
                    orders: {
                        where: {
                            orderDate: {
                                gte: startDate,
                                lte: endDate
                            }
                        }
                    }
                }
            }),

            // Previous period orders for comparison
            prisma.order.findMany({
                where: {
                    orderDate: {
                        gte: previousStartDate,
                        lte: previousEndDate
                    },
                    status: {
                        not: 'CANCELLED'
                    }
                }
            })
        ])

        // Calculate summary metrics
        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
        const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
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
        const activeCustomers = customers.filter(c => c.orders.length > 0)
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
            order.orderItems.forEach(item => {
                const dishId = item.dishId
                const existing = dishStats.get(dishId) || {
                    name: item.dish.name,
                    quantity: 0,
                    revenue: 0,
                    category: item.dish.category
                }
                existing.quantity += item.quantity
                existing.revenue += Number(item.price) * item.quantity
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
            const totalSpent = customerOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
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
            const orderDate = new Date(order.orderDate)
            return orderDate >= periodStart && orderDate <= periodEnd
        })

        const amount = periodOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0)

        return {
            date: format(interval, periodType === 'month' ? 'MMM yyyy' : 'dd/MM'),
            amount
        }
    })
}
