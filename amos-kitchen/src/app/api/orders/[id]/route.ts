// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
    getOrderById,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    getOrderHistory,
    addOrderHistory
} from '@/lib/firebase/dao/orders'
import { getDishesByIds } from '@/lib/firebase/dao/dishes'

// Validation schema for updating order
const updateOrderSchema = z.object({
    status: z.enum(['new', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']).optional(),
    deliveryDate: z.string().optional(),
    notes: z.string().optional(),
    deliveryAddress: z.string().optional(),
})

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Fetch order
        const order = await getOrderById(params.id)

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Get order history
        const history = await getOrderHistory(params.id)

        // Get dish details
        const dishIds = order.items.map(item => item.dishId)
        const dishes = await getDishesByIds(dishIds)
        const dishMap = new Map(dishes.map(d => [d.id, d]))

        // Transform response
        const transformedOrder = {
            ...order,
            status: order.status.toLowerCase(),
            totalAmount: order.totalAmount,
            customer: order.customerData || { name: 'Unknown', phone: '' },
            orderItems: order.items.map(item => ({
                ...item,
                dish: dishMap.get(item.dishId) || { name: item.dishName || 'Unknown Dish' }
            })),
            items: order.items.map(item => ({
                ...item,
                dish: dishMap.get(item.dishId) || { name: item.dishName || 'Unknown Dish' }
            })),
            history
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
        const existingOrder = await getOrderById(params.id)

        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Prepare update data
        const updateData: any = {}

        if (validatedData.status) {
            updateData.status = validatedData.status.toUpperCase()
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
        await updateOrder(params.id, updateData)

        // Create history entry for status changes
        if (validatedData.status && validatedData.status.toUpperCase() !== existingOrder.status) {
            await addOrderHistory(params.id, {
                action: 'STATUS_CHANGED',
                details: {
                    message: `סטטוס שונה מ-${existingOrder.status.toLowerCase()} ל-${validatedData.status}`,
                    previousStatus: existingOrder.status,
                    newStatus: validatedData.status.toUpperCase()
                },
                userId: null
            })
        }

        // Get updated order
        const updatedOrder = await getOrderById(params.id)

        if (!updatedOrder) {
            return NextResponse.json({ error: 'Failed to get updated order' }, { status: 500 })
        }

        // Get dish details
        const dishIds = updatedOrder.items.map(item => item.dishId)
        const dishes = await getDishesByIds(dishIds)
        const dishMap = new Map(dishes.map(d => [d.id, d]))

        // Transform response
        const transformedOrder = {
            ...updatedOrder,
            status: updatedOrder.status.toLowerCase(),
            totalAmount: updatedOrder.totalAmount,
            customer: updatedOrder.customerData || { name: 'Unknown', phone: '' },
            orderItems: updatedOrder.items.map(item => ({
                ...item,
                dish: dishMap.get(item.dishId) || { name: item.dishName || 'Unknown Dish' }
            })),
            items: updatedOrder.items.map(item => ({
                ...item,
                dish: dishMap.get(item.dishId) || { name: item.dishName || 'Unknown Dish' }
            }))
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
        const order = await getOrderById(params.id)

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
        await deleteOrder(params.id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting order:', error)
        return NextResponse.json(
            { error: 'Failed to delete order' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { status } = body

        // Get existing order first
        const existingOrder = await getOrderById(params.id)
        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Update status
        await updateOrderStatus(params.id, status.toUpperCase())

        // Add to order history
        await addOrderHistory(params.id, {
            action: 'STATUS_CHANGED',
            details: {
                message: `סטטוס שונה ל-${status}`,
                previousStatus: existingOrder.status,
                newStatus: status.toUpperCase()
            },
            userId: null
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500 }
        )
    }
}

