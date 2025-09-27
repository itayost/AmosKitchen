// app/api/orders/weekly/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { startOfWeek, endOfWeek, format } from 'date-fns'
import { query, where, getDocs, orderBy } from 'firebase/firestore'
import { ordersCollection, dateToTimestamp } from '@/lib/firebase/firestore'
import { getDishesByIds } from '@/lib/firebase/dao/dishes'
import { getCustomerById } from '@/lib/firebase/dao/customers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const date = searchParams.get('date') ? new Date(searchParams.get('date')!) : new Date()

        // Get Friday of the week
        const weekStart = startOfWeek(date, { weekStartsOn: 0 })
        const weekEnd = endOfWeek(date, { weekStartsOn: 0 })

        // Fetch orders for this week from Firestore
        const ordersQuery = query(
            ordersCollection,
            where('deliveryDate', '>=', dateToTimestamp(weekStart)),
            where('deliveryDate', '<=', dateToTimestamp(weekEnd)),
            orderBy('deliveryDate', 'asc')
        )

        const ordersSnapshot = await getDocs(ordersQuery)
        const orders: any[] = []

        // Collect all dish and customer IDs
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
        const transformedOrders = orders.map(order => ({
            ...order,
            customer: order.customerData || customerMap.get(order.customerId) || { name: 'Unknown', phone: '' },
            orderItems: order.items?.map((item: any) => ({
                ...item,
                dish: dishMap.get(item.dishId) || { name: item.dishName || 'Unknown Dish' }
            })) || []
        }))

        // Calculate summary statistics
        const summary = {
            totalOrders: transformedOrders.length,
            totalRevenue: transformedOrders.reduce((sum, order) => sum + order.totalAmount, 0),
            confirmedOrders: transformedOrders.filter(o => o.status !== 'NEW' && o.status !== 'CANCELLED').length,
            pendingOrders: transformedOrders.filter(o => o.status === 'NEW').length,
            cancelledOrders: transformedOrders.filter(o => o.status === 'CANCELLED').length
        }

        // Group orders by delivery date
        const ordersByDate = transformedOrders.reduce((acc, order) => {
            const deliveryDate = order.deliveryDate?.toDate ? order.deliveryDate.toDate() : new Date(order.deliveryDate)
            const dateKey = format(deliveryDate, 'yyyy-MM-dd')
            if (!acc[dateKey]) {
                acc[dateKey] = []
            }
            acc[dateKey].push(order)
            return acc
        }, {} as Record<string, typeof transformedOrders>)

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
