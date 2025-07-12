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

        // Create history entry
        await prisma.orderHistory.create({
            data: {
                orderId: orderId,
                status: newStatus,
                notes: `Status changed to ${newStatus}`,
                createdBy: 'Kitchen Staff' // You might want to get this from the session
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
        // Update multiple orders at once
        await prisma.order.updateMany({
            where: {
                id: {
                    in: orderIds
                }
            },
            data: {
                status: newStatus,
                updatedAt: new Date()
            }
        });

        // Create history entries for all orders
        const historyEntries = orderIds.map(orderId => ({
            orderId,
            status: newStatus,
            notes: `Bulk status change to ${newStatus}`,
            createdBy: 'Kitchen Staff'
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
