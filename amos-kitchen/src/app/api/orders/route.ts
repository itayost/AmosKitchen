// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for order creation
const createOrderSchema = z.object({
    customerId: z.string().uuid(),
    deliveryDate: z.string().datetime(),
    deliveryAddress: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
        dishId: z.string().uuid(),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
        notes: z.string().optional()
    })).min(1)
})

// Generate order number (e.g., "ORD-2025-0001")
async function generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear()

    // Get the last order number for this year
    const lastOrder = await prisma.order.findFirst({
        where: {
            orderNumber: {
                startsWith: `ORD-${year}-`
            }
        },
        orderBy: {
            orderNumber: 'desc'
        }
    })

    let nextNumber = 1
    if (lastOrder && lastOrder.orderNumber) {
        const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2])
        nextNumber = lastNumber + 1
    }

    return `ORD-${year}-${nextNumber.toString().padStart(4, '0')}`
}

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
                { orderNumber: { contains: search, mode: 'insensitive' } },
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
            where.status = statusMap[status] || 'NEW'
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

        // Get total count for pagination
        const totalCount = await prisma.order.count({ where })

        // Fetch orders with related data
        const orders = await prisma.order.findMany({
            where,
            include: {
                customer: true,
                orderItems: {
                    include: {
                        dish: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        })

        // Transform orders to match frontend expectations
        const transformedOrders = orders.map(order => ({
            ...order,
            status: mapOrderStatus(order.status),
            totalAmount: Number(order.totalAmount),
            items: order.orderItems // Map orderItems to items for frontend
        }))

        return NextResponse.json({
            orders: transformedOrders,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching orders:', error)
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('Create order request:', body)

        // Validate request body
        const validatedData = createOrderSchema.parse(body)

        // Calculate total amount
        const totalAmount = validatedData.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity)
        }, 0)

        // Generate order number
        const orderNumber = await generateOrderNumber()

        // Create order with items
        const order = await prisma.order.create({
            data: {
                orderNumber,
                customerId: validatedData.customerId,
                deliveryDate: new Date(validatedData.deliveryDate),
                deliveryAddress: validatedData.deliveryAddress,
                totalAmount,
                status: 'NEW',
                notes: validatedData.notes || '',
                orderItems: {  // Changed from 'items' to 'orderItems'
                    create: validatedData.items.map(item => ({
                        dishId: item.dishId,
                        quantity: item.quantity,
                        price: item.price,
                        notes: item.notes || ''
                    }))
                }
            },
            include: {
                customer: true,
                orderItems: {  // Changed from 'items' to 'orderItems'
                    include: {
                        dish: true
                    }
                }
            }
        })

        // Create initial history entry
        await prisma.orderHistory.create({
            data: {
                orderId: order.id,
                action: 'CREATED',
                details: `הזמנה נוצרה עם ${order.orderItems.length} פריטים`
            }
        })

        // Transform response
        const transformedOrder = {
            ...order,
            status: mapOrderStatus(order.status),
            totalAmount: Number(order.totalAmount),
            items: order.orderItems // Map orderItems to items for frontend consistency
        }

        console.log('Order created successfully:', order.orderNumber)
        return NextResponse.json(transformedOrder, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Validation error:', error.errors)
            return NextResponse.json(
                { error: 'Invalid data', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Error creating order:', error)
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        )
    }
}
