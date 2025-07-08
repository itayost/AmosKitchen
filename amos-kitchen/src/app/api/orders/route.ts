// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Map Prisma enum values to lowercase for frontend
const mapOrderStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
        'NEW': 'new',
        'CONFIRMED': 'confirmed',
        'PREPARING': 'preparing',
        'READY': 'ready',
        'DELIVERED': 'delivered',
        'CANCELLED': 'cancelled'
    }
    return statusMap[status] || status.toLowerCase()
}

export async function GET(request: NextRequest) {
    try {
        console.log('Orders API called')

        // Get query parameters
        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || 'all'
        const dateRange = searchParams.get('dateRange') || 'all'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {}

        // Search filter
        if (search) {
            where.OR = [
                { customer: { name: { contains: search, mode: 'insensitive' } } },
                { customer: { phone: { contains: search } } }
            ]
        }

        // Status filter - convert lowercase to uppercase for Prisma
        if (status !== 'all') {
            const statusMap: Record<string, string> = {
                'new': 'NEW',
                'confirmed': 'CONFIRMED',
                'preparing': 'PREPARING',
                'ready': 'READY',
                'delivered': 'DELIVERED',
                'cancelled': 'CANCELLED'
            }
            where.status = statusMap[status] || status.toUpperCase()
        }

        // Date range filter
        if (dateRange !== 'all') {
            const now = new Date()
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

            switch (dateRange) {
                case 'today':
                    where.deliveryDate = {
                        gte: today,
                        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                    }
                    break
                case 'week':
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                    where.deliveryDate = {
                        gte: weekAgo,
                        lte: now
                    }
                    break
                case 'month':
                    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                    where.deliveryDate = {
                        gte: monthAgo,
                        lte: now
                    }
                    break
            }
        }

        // Fetch orders with pagination
        const [ordersData, totalCount] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    customer: true,
                    items: {
                        include: {
                            dish: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.order.count({ where })
        ])

        // Transform the data to match frontend expectations
        const orders = ordersData.map((order, index) => ({
            id: order.id,
            orderNumber: `ORD-${String(skip + index + 1).padStart(4, '0')}`, // Generate order number
            customer: order.customer,
            customerId: order.customerId,
            deliveryDate: order.deliveryDate,
            deliveryAddress: '', // Add empty string for now
            totalAmount: Number(order.totalAmount),
            status: mapOrderStatus(order.status),
            notes: order.notes,
            itemsCount: order.items.length,
            orderItems: order.items.map(item => ({
                id: item.id,
                orderId: item.orderId,
                dishId: item.dishId,
                dish: {
                    ...item.dish,
                    price: Number(item.dish.price)
                },
                quantity: item.quantity,
                price: Number(item.price),
                notes: item.notes,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt
            })),
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        }))

        console.log(`Returning ${orders.length} orders out of ${totalCount} total`)

        return NextResponse.json({
            orders,
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit)
        })
    } catch (error) {
        console.error('Error fetching orders:', error)
        return NextResponse.json(
            { error: 'Failed to fetch orders', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Generate order number
        const orderCount = await prisma.order.count()
        const orderNumber = `ORD-${String(orderCount + 1).padStart(4, '0')}`

        // Calculate total amount
        const totalAmount = body.items.reduce(
            (sum: number, item: any) => sum + (item.price * item.quantity),
            0
        )

        // Create order with items
        const order = await prisma.order.create({
            data: {
                customerId: body.customerId,
                deliveryDate: new Date(body.deliveryDate),
                totalAmount,
                status: 'NEW',
                notes: body.notes,
                items: {
                    create: body.items.map((item: any) => ({
                        dishId: item.dishId,
                        quantity: item.quantity,
                        price: item.price,
                        notes: item.notes
                    }))
                }
            },
            include: {
                customer: true,
                items: {
                    include: {
                        dish: true
                    }
                }
            }
        })

        // Transform the response
        const transformedOrder = {
            ...order,
            orderNumber,
            deliveryAddress: '',
            status: mapOrderStatus(order.status),
            totalAmount: Number(order.totalAmount),
            itemsCount: order.items.length,
            orderItems: order.items.map(item => ({
                ...item,
                price: Number(item.price),
                dish: {
                    ...item.dish,
                    price: Number(item.dish.price)
                }
            }))
        }

        return NextResponse.json(transformedOrder, { status: 201 })
    } catch (error) {
        console.error('Error creating order:', error)
        return NextResponse.json(
            { error: 'Failed to create order', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
