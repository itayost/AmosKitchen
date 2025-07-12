// app/api/orders/weekly/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfWeek, endOfWeek, format } from 'date-fns'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const date = searchParams.get('date') ? new Date(searchParams.get('date')!) : new Date()

        // Get Friday of the week
        const weekStart = startOfWeek(date, { weekStartsOn: 0 })
        const weekEnd = endOfWeek(date, { weekStartsOn: 0 })

        // Fetch orders for this week
        const orders = await prisma.order.findMany({
            where: {
                deliveryDate: {
                    gte: weekStart,
                    lte: weekEnd
                }
            },
            include: {
                customer: true,
                orderItems: {
                    include: {
                        dish: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Calculate summary statistics
        const summary = {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
            confirmedOrders: orders.filter(o => o.status !== 'NEW' && o.status !== 'CANCELLED').length,
            pendingOrders: orders.filter(o => o.status === 'NEW').length,
            cancelledOrders: orders.filter(o => o.status === 'CANCELLED').length
        }

        // Group orders by delivery date
        const ordersByDate = orders.reduce((acc, order) => {
            const dateKey = format(new Date(order.deliveryDate), 'yyyy-MM-dd')
            if (!acc[dateKey]) {
                acc[dateKey] = []
            }
            acc[dateKey].push(order)
            return acc
        }, {} as Record<string, typeof orders>)

        return NextResponse.json({
            week: {
                start: weekStart,
                end: weekEnd
            },
            summary,
            orders,
            ordersByDate
        })
    } catch (error) {
        console.error('Error fetching weekly orders:', error)
        return NextResponse.json(
            { error: 'Failed to fetch weekly orders' },
            { status: 500 }
        )
    }
}
