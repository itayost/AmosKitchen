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

        // Fetch order with history
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

        // Start transaction for atomic updates
        const result = await prisma.$transaction(async (tx) => {
            // Get current order state for comparison
            const currentOrder = await tx.order.findUnique({
                where: { id: params.id },
                include: {
                    orderItems: {
                        include: {
                            dish: true
                        }
                    }
                }
            })

            if (!currentOrder) {
                throw new Error('Order not found')
            }

            const historyEntries = []

            // Track status change
            if (validatedData.status && validatedData.status !== currentOrder.status) {
                historyEntries.push({
                    orderId: params.id,
                    userId: session.user?.id || 'system',
                    action: 'status_change',
                    details: {
                        from: currentOrder.status,
                        to: validatedData.status,
                        fromLabel: getStatusLabel(currentOrder.status),
                        toLabel: getStatusLabel(validatedData.status)
                    }
                })
            }

            // Track general order updates
            const orderChanges: any = {}
            if (validatedData.deliveryDate && new Date(validatedData.deliveryDate).toISOString() !== currentOrder.deliveryDate.toISOString()) {
                orderChanges.deliveryDate = {
                    from: currentOrder.deliveryDate,
                    to: new Date(validatedData.deliveryDate)
                }
            }
            if (validatedData.notes !== undefined && validatedData.notes !== currentOrder.notes) {
                orderChanges.notes = {
                    from: currentOrder.notes,
                    to: validatedData.notes
                }
            }
            if (validatedData.deliveryAddress !== undefined && validatedData.deliveryAddress !== currentOrder.deliveryAddress) {
                orderChanges.deliveryAddress = {
                    from: currentOrder.deliveryAddress,
                    to: validatedData.deliveryAddress
                }
            }

            if (Object.keys(orderChanges).length > 0) {
                historyEntries.push({
                    orderId: params.id,
                    userId: session.user?.id || 'system',
                    action: 'order_updated',
                    details: orderChanges
                })
            }

            let updatedOrder

            // If updating items, handle the complex update
            if (validatedData.items) {
                // Track item changes
                const currentItemsMap = new Map(
                    currentOrder.orderItems.map(item => [item.dishId, item])
                )
                const newItemsMap = new Map(
                    validatedData.items.map(item => [item.dishId, item])
                )

                // Find removed items
                for (const [dishId, item] of currentItemsMap) {
                    if (!newItemsMap.has(dishId)) {
                        historyEntries.push({
                            orderId: params.id,
                            userId: session.user?.id || 'system',
                            action: 'item_removed',
                            details: {
                                dishId: item.dishId,
                                dishName: item.dish.name,
                                quantity: item.quantity,
                                price: item.price
                            }
                        })
                    }
                }

                // Find added and updated items
                for (const [dishId, newItem] of newItemsMap) {
                    const currentItem = currentItemsMap.get(dishId)
                    if (!currentItem) {
                        // Item added
                        const dish = await tx.dish.findUnique({ where: { id: dishId } })
                        historyEntries.push({
                            orderId: params.id,
                            userId: session.user?.id || 'system',
                            action: 'item_added',
                            details: {
                                dishId: newItem.dishId,
                                dishName: dish?.name || 'Unknown',
                                quantity: newItem.quantity,
                                price: newItem.price
                            }
                        })
                    } else if (currentItem.quantity !== newItem.quantity) {
                        // Item updated
                        historyEntries.push({
                            orderId: params.id,
                            userId: session.user?.id || 'system',
                            action: 'item_updated',
                            details: {
                                dishId: newItem.dishId,
                                dishName: currentItem.dish.name,
                                oldQuantity: currentItem.quantity,
                                newQuantity: newItem.quantity,
                                price: newItem.price
                            }
                        })
                    }
                }

                // Calculate new total amount
                const totalAmount = validatedData.items.reduce(
                    (sum, item) => sum + (item.price * item.quantity),
                    0
                )

                // Delete all existing items and recreate them
                await tx.orderItem.deleteMany({
                    where: { orderId: params.id }
                })

                // Update order with new items
                updatedOrder = await tx.order.update({
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
            } else {
                // Simple update without items
                updatedOrder = await tx.order.update({
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
            }

            // Create history entries
            if (historyEntries.length > 0) {
                await tx.orderHistory.createMany({
                    data: historyEntries
                })
            }

            // Fetch the updated order with history
            const orderWithHistory = await tx.order.findUnique({
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

            return orderWithHistory
        })

        return NextResponse.json(result)
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

// Helper function to get status label
function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        new: 'חדש',
        confirmed: 'מאושר',
        preparing: 'בהכנה',
        ready: 'מוכן',
        delivered: 'נמסר',
        cancelled: 'בוטל'
    }
    return labels[status] || status
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

        // Delete order (cascade will delete order items and history)
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
