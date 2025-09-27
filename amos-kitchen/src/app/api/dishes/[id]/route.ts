// src/app/api/dishes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
    getDishById,
    updateDish,
    deleteDish,
    isDishExists
} from '@/lib/firebase/dao/dishes'
import { getOrders } from '@/lib/firebase/dao/orders'

// Validation schema for dish update
const updateDishSchema = z.object({
    name: z.string().min(1, 'שם המנה הוא שדה חובה').optional(),
    description: z.string().optional(),
    price: z.number().positive('מחיר חייב להיות חיובי').optional(),
    category: z.string().min(1, 'קטגוריה היא שדה חובה').optional(),
    isAvailable: z.boolean().optional()
})

// GET /api/dishes/[id] - Get a single dish
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log('GET /api/dishes/[id] - Fetching dish with ID:', params.id)
        const dish = await getDishById(params.id)
        console.log('Dish fetched:', dish)

        if (!dish) {
            console.log('Dish not found with ID:', params.id)
            return NextResponse.json(
                { error: 'Dish not found' },
                { status: 404 }
            )
        }

        // Get order statistics for this dish
        // This is a simplified version - in production you might want to use aggregation
        const { orders } = await getOrders({}, 100) // Get recent orders
        let totalOrders = 0
        let totalQuantity = 0
        let totalRevenue = 0

        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.dishId === params.id) {
                    totalOrders++
                    totalQuantity += item.quantity
                    totalRevenue += item.price * item.quantity
                }
            })
        })

        // Transform and add statistics
        const response = {
            ...dish,
            category: dish.category?.toLowerCase() || 'main',
            price: Number(dish.price),
            stats: {
                totalOrders,
                totalQuantity,
                totalRevenue
            },
            orderItems: [] // Recent orders that include this dish
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Error fetching dish:', error)
        return NextResponse.json(
            { error: 'Failed to fetch dish' },
            { status: 500 }
        )
    }
}

// PUT /api/dishes/[id] - Update a dish
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const validatedData = updateDishSchema.parse(body)

        // Check if dish exists
        const exists = await isDishExists(params.id)
        if (!exists) {
            return NextResponse.json(
                { error: 'המנה לא נמצאה' },
                { status: 404 }
            )
        }

        // Update dish
        await updateDish(params.id, {
            ...(validatedData.name && { name: validatedData.name }),
            ...(validatedData.description !== undefined && { description: validatedData.description }),
            ...(validatedData.price && { price: validatedData.price }),
            ...(validatedData.category && { category: validatedData.category.toUpperCase() }),
            ...(validatedData.isAvailable !== undefined && { isAvailable: validatedData.isAvailable })
        })

        // Get updated dish
        const updatedDish = await getDishById(params.id)

        if (!updatedDish) {
            return NextResponse.json(
                { error: 'Failed to get updated dish' },
                { status: 500 }
            )
        }

        // Transform response for frontend
        const response = {
            ...updatedDish,
            category: updatedDish.category?.toLowerCase() || 'main',
            price: Number(updatedDish.price)
        }

        return NextResponse.json(response)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid data', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Error updating dish:', error)
        return NextResponse.json(
            { error: 'Failed to update dish' },
            { status: 500 }
        )
    }
}

// DELETE /api/dishes/[id] - Delete a dish
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check if dish is used in any orders
        const { orders } = await getOrders({}, 100)
        let isUsedInOrders = false

        for (const order of orders) {
            if (order.items.some(item => item.dishId === params.id)) {
                isUsedInOrders = true
                break
            }
        }

        if (isUsedInOrders) {
            return NextResponse.json(
                { error: 'Cannot delete dish that has been ordered. Mark as unavailable instead.' },
                { status: 400 }
            )
        }

        // Delete dish
        await deleteDish(params.id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting dish:', error)
        return NextResponse.json(
            { error: 'Failed to delete dish' },
            { status: 500 }
        )
    }
}