'use server';

import { prisma } from '@/lib/db';
import { OrderStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getOrdersForToday() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const orders = await prisma.order.findMany({
            where: {
                deliveryDate: {
                    gte: today,
                    lt: tomorrow
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
            },
            orderBy: [
                { status: 'asc' },
                { createdAt: 'asc' }
            ]
        });

        return orders || [];
    } catch (error) {
        console.error('Error in getOrdersForToday:', error);
        return [];
    }
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    try {
        // Get the current order to track the previous status
        const currentOrder = await prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true }
        });

        if (!currentOrder) {
            return { success: false, error: 'Order not found' };
        }

        // Update the order status
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: newStatus,
                updatedAt: new Date()
            },
            include: {
                customer: true,
                orderItems: {
                    include: {
                        dish: true
                    }
                }
            }
        });

        // Create history entry with correct fields
        await prisma.orderHistory.create({
            data: {
                orderId: orderId,
                action: 'STATUS_CHANGED',  // Required field
                details: {
                    previousStatus: currentOrder.status,
                    newStatus: newStatus,
                    notes: `Status changed from ${currentOrder.status} to ${newStatus}`,
                    changedBy: 'Kitchen Staff',
                    timestamp: new Date().toISOString()
                },
                userId: null  // Optional - set to null or pass actual user ID
            }
        });

        revalidatePath('/kitchen');
        revalidatePath('/orders');

        return { success: true, order: updatedOrder };
    } catch (error) {
        console.error('Failed to update order status:', error);
        return { success: false, error: 'Failed to update order status' };
    }
}

export async function bulkUpdateOrderStatus(orderIds: string[], newStatus: OrderStatus) {
    try {
        // Get current statuses for history tracking
        const currentOrders = await prisma.order.findMany({
            where: {
                id: { in: orderIds }
            },
            select: {
                id: true,
                status: true
            }
        });

        // Update multiple orders at once
        await prisma.order.updateMany({
            where: {
                id: { in: orderIds }
            },
            data: {
                status: newStatus,
                updatedAt: new Date()
            }
        });

        // Create history entries for all orders with correct fields
        const historyEntries = currentOrders.map(order => ({
            orderId: order.id,
            action: 'STATUS_CHANGED',  // Required field
            details: {
                previousStatus: order.status,
                newStatus: newStatus,
                notes: `Bulk status change from ${order.status} to ${newStatus}`,
                changedBy: 'Kitchen Staff',
                bulkUpdate: true,
                totalOrders: orderIds.length,
                timestamp: new Date().toISOString()
            },
            userId: null  // Optional - set to null or pass actual user ID
        }));

        await prisma.orderHistory.createMany({
            data: historyEntries
        });

        revalidatePath('/kitchen');
        revalidatePath('/orders');

        return { success: true };
    } catch (error) {
        console.error('Failed to bulk update order status:', error);
        return { success: false, error: 'Failed to update orders' };
    }
}
