'use server';

import { revalidatePath } from 'next/cache';
import { getTodayOrders, updateOrderStatus as updateOrderFirestore, addOrderHistory } from '@/lib/firebase/dao/orders';
import { getDishesByIds } from '@/lib/firebase/dao/dishes';
import type { OrderStatus } from '@/lib/types/database';

export async function getOrdersForToday() {
    try {
        // Get today's orders from Firestore
        const orders = await getTodayOrders();

        // Filter out cancelled orders
        const activeOrders = orders.filter(order => order.status !== 'CANCELLED');

        // Get all unique dish IDs
        const dishIds = new Set<string>();
        activeOrders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => dishIds.add(item.dishId));
            }
        });

        // Fetch dish details
        const dishes = await getDishesByIds(Array.from(dishIds));
        const dishMap = new Map(dishes.map(d => [d.id, d]));

        // Transform orders to match expected format
        const transformedOrders = activeOrders.map(order => ({
            ...order,
            customer: order.customerData || { name: 'Unknown', phone: '' },
            orderItems: order.items?.map(item => ({
                ...item,
                dish: dishMap.get(item.dishId) || {
                    name: item.dishName || 'Unknown Dish',
                    category: 'MAIN'
                }
            })) || []
        }));

        // Sort by status and creation date
        const statusOrder = ['NEW', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'];
        transformedOrders.sort((a, b) => {
            const statusDiff = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
            if (statusDiff !== 0) return statusDiff;
            return a.createdAt < b.createdAt ? -1 : 1;
        });

        return transformedOrders;
    } catch (error) {
        console.error('Error in getOrdersForToday:', error);
        return [];
    }
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    try {
        // Update order status in Firestore
        await updateOrderFirestore(orderId, newStatus, 'kitchen-staff');

        // Create history entry
        await addOrderHistory(orderId, {
            action: 'STATUS_CHANGED',
            details: {
                newStatus: newStatus,
                changedBy: 'Kitchen Staff',
                timestamp: new Date().toISOString()
            },
            userId: null
        });

        revalidatePath('/kitchen');
        revalidatePath('/orders');

        return { success: true };
    } catch (error) {
        console.error('Failed to update order status:', error);
        return { success: false, error: 'Failed to update order status' };
    }
}

export async function bulkUpdateOrderStatus(orderIds: string[], newStatus: OrderStatus) {
    try {
        // Update each order and create history entries
        const updatePromises = orderIds.map(async (orderId) => {
            // Update order status
            await updateOrderFirestore(orderId, newStatus, 'kitchen-staff');

            // Create history entry
            await addOrderHistory(orderId, {
                action: 'STATUS_CHANGED',
                details: {
                    newStatus: newStatus,
                    notes: `Bulk status change to ${newStatus}`,
                    changedBy: 'Kitchen Staff',
                    bulkUpdate: true,
                    totalOrders: orderIds.length,
                    timestamp: new Date().toISOString()
                },
                userId: null
            });
        });

        await Promise.all(updatePromises);

        revalidatePath('/kitchen');
        revalidatePath('/orders');

        return { success: true };
    } catch (error) {
        console.error('Failed to bulk update order status:', error);
        return { success: false, error: 'Failed to update orders' };
    }
}
