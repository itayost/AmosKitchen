// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { OrderStatus } from '@/lib/types/database'

// Validation schema for updating order
const updateOrderSchema = z.object({
    status: z.enum(['new', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']).optional(),
    deliveryDate: z.string().datetime().optional(),
    notes: z.string().optional(),
    deliveryAddress: z.string().optional(),
    items: z.array(z.object({
        id: z.string().optional(),
        dishId: z.string(),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
        notes: z.string().optional()
    })).optional()
})

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch order
        const order = await prisma.order.findUnique({
            where: { id: params.id },
            include: {
                customer: true,
                orderItems: {
                    include: {
                        dish: true
                    }
                }
            }
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        return NextResponse.json(order)
    } catch (error) {
        console.error('Error fetching order:', error)
        return NextResponse.json(
            { error: 'Failed to fetch order' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Parse and validate request body
        const body = await request.json()
        const validatedData = updateOrderSchema.parse(body)

        // Check if order exists
        const existingOrder = await prisma.order.findUnique({
            where: { id: params.id }
        })

        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // If updating items, handle the complex update
        if (validatedData.items) {
            // Calculate new total amount
            const totalAmount = validatedData.items.reduce(
                (sum, item) => sum + (item.price * item.quantity),
                0
            )

            // Delete all existing items and recreate them
            await prisma.orderItem.deleteMany({
                where: { orderId: params.id }
            })

            // Update order with new items
            const updatedOrder = await prisma.order.update({
                where: { id: params.id },
                data: {
                    deliveryDate: validatedData.deliveryDate ? new Date(validatedData.deliveryDate) : undefined,
                    status: validatedData.status as OrderStatus,
                    notes: validatedData.notes,
                    deliveryAddress: validatedData.deliveryAddress,
                    totalAmount,
                    orderItems: {
                        create: validatedData.items.map(item => ({
                            dishId: item.dishId,
                            quantity: item.quantity,
                            price: item.price,
                            notes: item.notes
                        }))
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
            })

            return NextResponse.json(updatedOrder)
        } else {
            // Simple update without items
            const updatedOrder = await prisma.order.update({
                where: { id: params.id },
                data: {
                    deliveryDate: validatedData.deliveryDate ? new Date(validatedData.deliveryDate) : undefined,
                    status: validatedData.status as OrderStatus,
                    notes: validatedData.notes,
                    deliveryAddress: validatedData.deliveryAddress
                },
                include: {
                    customer: true,
                    orderItems: {
                        include: {
                            dish: true
                        }
                    }
                }
            })

            return NextResponse.json(updatedOrder)
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Error updating order:', error)
        return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if order exists
        const existingOrder = await prisma.order.findUnique({
            where: { id: params.id }
        })

        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Delete order (cascade will delete order items)
        await prisma.order.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ message: 'Order deleted successfully' })
    } catch (error) {
        console.error('Error deleting order:', error)
        return NextResponse.json(
            { error: 'Failed to delete order' },
            { status: 500 }
        )
    }
}
