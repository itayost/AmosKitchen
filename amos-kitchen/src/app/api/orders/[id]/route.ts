// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for updating order
const updateOrderSchema = z.object({
    status: z.enum(['new', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']).optional(),
    deliveryDate: z.string().datetime().optional(),
    notes: z.string().optional(),
    deliveryAddress: z.string().optional(),
})

// Map status for Prisma
const mapStatusToPrisma = (status: string): string => {
    const statusMap: Record<string, string> = {
        'new': 'NEW',
        'confirmed': 'CONFIRMED',
        'preparing': 'PREPARING',
        'ready': 'READY',
        'delivered': 'DELIVERED',
        'cancelled': 'CANCELLED'
    }
    return statusMap[status] || 'NEW'
}

// Map status for frontend
const mapStatusFromPrisma = (status: string): string => {
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

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Fetch order with relations
        const order = await prisma.order.findUnique({
            where: { id: params.id },
            include: {
                customer: true,
                orderItems: {
                    include: {
                        dish: true
                    }
                },
                history: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                }
            }
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Transform response
        const transformedOrder = {
            ...order,
            status: mapStatusFromPrisma(order.status),
            totalAmount: Number(order.totalAmount),
            items: order.orderItems
        }

        return NextResponse.json(transformedOrder)
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
        const body = await request.json()
        const validatedData = updateOrderSchema.parse(body)

        // Check if order exists
        const existingOrder = await prisma.order.findUnique({
            where: { id: params.id },
            include: { customer: true }
        })

        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Prepare update data
        const updateData: any = {}

        if (validatedData.status) {
            updateData.status = mapStatusToPrisma(validatedData.status)
        }

        if (validatedData.deliveryDate) {
            updateData.deliveryDate = new Date(validatedData.deliveryDate)
        }

        if (validatedData.notes !== undefined) {
            updateData.notes = validatedData.notes
        }

        if (validatedData.deliveryAddress !== undefined) {
            updateData.deliveryAddress = validatedData.deliveryAddress
        }

        // Update order
        const updatedOrder = await prisma.order.update({
            where: { id: params.id },
            data: updateData,
            include: {
                customer: true,
                orderItems: {
                    include: {
                        dish: true
                    }
                }
            }
        })

        // Create history entry for status changes
        if (validatedData.status && validatedData.status !== mapStatusFromPrisma(existingOrder.status)) {
            await prisma.orderHistory.create({
                data: {
                    orderId: params.id,
                    action: 'STATUS_CHANGED',
                    details: `סטטוס שונה מ-${mapStatusFromPrisma(existingOrder.status)} ל-${validatedData.status}`
                }
            })
        }

        // Transform response
        const transformedOrder = {
            ...updatedOrder,
            status: mapStatusFromPrisma(updatedOrder.status),
            totalAmount: Number(updatedOrder.totalAmount),
            items: updatedOrder.orderItems
        }

        return NextResponse.json(transformedOrder)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid data', details: error.errors },
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
        // Check if order exists
        const order = await prisma.order.findUnique({
            where: { id: params.id }
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Don't allow deletion of delivered orders
        if (order.status === 'DELIVERED') {
            return NextResponse.json(
                { error: 'Cannot delete delivered orders' },
                { status: 400 }
            )
        }

        // Delete order (this will cascade delete order items and history)
        await prisma.order.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting order:', error)
        return NextResponse.json(
            { error: 'Failed to delete order' },
            { status: 500 }
        )
    }
}
