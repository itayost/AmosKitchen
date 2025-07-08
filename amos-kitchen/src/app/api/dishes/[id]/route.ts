// src/app/api/dishes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for dish update
const updateDishSchema = z.object({
    name: z.string().min(1, 'שם המנה הוא שדה חובה').optional(),
    description: z.string().optional(),
    price: z.number().positive('מחיר חייב להיות חיובי').optional(),
    category: z.string().min(1, 'קטגוריה היא שדה חובה').optional(),
    isAvailable: z.boolean().optional(),
    ingredients: z.array(z.object({
        ingredientId: z.string(),
        quantity: z.number().positive(),
        notes: z.string().optional()
    })).optional()
})

// GET /api/dishes/[id] - Get a single dish
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const dish = await prisma.dish.findUnique({
            where: { id: params.id },
            include: {
                ingredients: {
                    include: {
                        ingredient: true
                    }
                },
                orderItems: {
                    select: {
                        id: true,
                        quantity: true,
                        order: {
                            select: {
                                id: true,
                                orderNumber: true,
                                deliveryDate: true,
                                customer: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    },
                    take: 10,
                    orderBy: {
                        order: {
                            createdAt: 'desc'
                        }
                    }
                }
            }
        })

        if (!dish) {
            return NextResponse.json(
                { error: 'Dish not found' },
                { status: 404 }
            )
        }

        // Add statistics
        const stats = {
            totalOrders: await prisma.orderItem.count({
                where: { dishId: dish.id }
            }),
            totalQuantity: await prisma.orderItem.aggregate({
                where: { dishId: dish.id },
                _sum: { quantity: true }
            }),
            totalRevenue: await prisma.orderItem.aggregate({
                where: { dishId: dish.id },
                _sum: { price: true }
            })
        }

        return NextResponse.json({
            ...dish,
            stats: {
                totalOrders: stats.totalOrders,
                totalQuantity: stats.totalQuantity._sum.quantity || 0,
                totalRevenue: stats.totalRevenue._sum.price || 0
            }
        })
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

        // If ingredients are provided, we need to update them
        if (validatedData.ingredients) {
            // Delete existing ingredients
            await prisma.dishIngredient.deleteMany({
                where: { dishId: params.id }
            })
        }

        // Update dish
        const dish = await prisma.dish.update({
            where: { id: params.id },
            data: {
                ...(validatedData.name && { name: validatedData.name }),
                ...(validatedData.description !== undefined && { description: validatedData.description }),
                ...(validatedData.price && { price: validatedData.price }),
                ...(validatedData.category && { category: validatedData.category }),
                ...(validatedData.isAvailable !== undefined && { isAvailable: validatedData.isAvailable }),
                ...(validatedData.ingredients && {
                    ingredients: {
                        create: validatedData.ingredients.map(ing => ({
                            ingredientId: ing.ingredientId,
                            quantity: ing.quantity,
                            notes: ing.notes
                        }))
                    }
                })
            },
            include: {
                ingredients: {
                    include: {
                        ingredient: true
                    }
                }
            }
        })

        return NextResponse.json(dish)
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
        const orderItemsCount = await prisma.orderItem.count({
            where: { dishId: params.id }
        })

        if (orderItemsCount > 0) {
            return NextResponse.json(
                { error: 'Cannot delete dish that has been ordered. Mark as unavailable instead.' },
                { status: 400 }
            )
        }

        // Delete dish (ingredients will be cascade deleted)
        await prisma.dish.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting dish:', error)
        return NextResponse.json(
            { error: 'Failed to delete dish' },
            { status: 500 }
        )
    }
}
