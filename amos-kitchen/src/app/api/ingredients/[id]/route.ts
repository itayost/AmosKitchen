// src/app/api/ingredients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for ingredient update
const updateIngredientSchema = z.object({
    name: z.string().min(1, 'שם הרכיב הוא שדה חובה').optional(),
    unit: z.string().min(1, 'יחידת מידה היא שדה חובה').optional(),
    minStock: z.number().optional().nullable(),
    currentStock: z.number().optional().nullable(),
    costPerUnit: z.number().optional().nullable(),
    supplier: z.string().optional().nullable(),
    category: z.string().optional().nullable()
})

// GET /api/ingredients/[id] - Get a single ingredient with usage details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const ingredient = await prisma.ingredient.findUnique({
            where: { id: params.id },
            include: {
                dishes: {
                    include: {
                        dish: {
                            include: {
                                _count: {
                                    select: { orderItems: true }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!ingredient) {
            return NextResponse.json(
                { error: 'Ingredient not found' },
                { status: 404 }
            )
        }

        // Calculate usage statistics
        const weeklyUsage = await calculateWeeklyUsage(params.id)
        const monthlyUsage = await calculateMonthlyUsage(params.id)

        return NextResponse.json({
            ...ingredient,
            stats: {
                dishCount: ingredient.dishes.length,
                weeklyUsage,
                monthlyUsage,
                lowStock: ingredient.currentStock && ingredient.minStock
                    ? ingredient.currentStock < ingredient.minStock
                    : false
            }
        })
    } catch (error) {
        console.error('Error fetching ingredient:', error)
        return NextResponse.json(
            { error: 'Failed to fetch ingredient' },
            { status: 500 }
        )
    }
}

// PUT /api/ingredients/[id] - Update an ingredient
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const validatedData = updateIngredientSchema.parse(body)

        // If name is being changed, check if it already exists
        if (validatedData.name) {
            const existing = await prisma.ingredient.findFirst({
                where: {
                    name: validatedData.name,
                    NOT: { id: params.id }
                }
            })

            if (existing) {
                return NextResponse.json(
                    { error: 'רכיב עם שם זה כבר קיים במערכת' },
                    { status: 400 }
                )
            }
        }

        const ingredient = await prisma.ingredient.update({
            where: { id: params.id },
            data: validatedData,
            include: {
                dishes: {
                    include: {
                        dish: true
                    }
                }
            }
        })

        return NextResponse.json(ingredient)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid data', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Error updating ingredient:', error)
        return NextResponse.json(
            { error: 'Failed to update ingredient' },
            { status: 500 }
        )
    }
}

// DELETE /api/ingredients/[id] - Delete an ingredient
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check if ingredient is used in any dishes
        const dishIngredientCount = await prisma.dishIngredient.count({
            where: { ingredientId: params.id }
        })

        if (dishIngredientCount > 0) {
            return NextResponse.json(
                {
                    error: 'לא ניתן למחוק רכיב שמשמש במנות. הסר תחילה את הרכיב מכל המנות.',
                    dishCount: dishIngredientCount
                },
                { status: 400 }
            )
        }

        await prisma.ingredient.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting ingredient:', error)
        return NextResponse.json(
            { error: 'Failed to delete ingredient' },
            { status: 500 }
        )
    }
}

// Helper function to calculate weekly usage
async function calculateWeeklyUsage(ingredientId: string): Promise<number> {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const result = await prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COALESCE(SUM(oi.quantity * di.quantity), 0) as total
        FROM order_items oi
        JOIN orders o ON oi."orderId" = o.id
        JOIN dish_ingredients di ON di."dishId" = oi."dishId"
        WHERE di."ingredientId" = ${ingredientId}
        AND o."deliveryDate" >= ${oneWeekAgo}
    `

    return Number(result[0]?.total || 0)
}

// Helper function to calculate monthly usage
async function calculateMonthlyUsage(ingredientId: string): Promise<number> {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    const result = await prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COALESCE(SUM(oi.quantity * di.quantity), 0) as total
        FROM order_items oi
        JOIN orders o ON oi."orderId" = o.id
        JOIN dish_ingredients di ON di."dishId" = oi."dishId"
        WHERE di."ingredientId" = ${ingredientId}
        AND o."deliveryDate" >= ${oneMonthAgo}
    `

    return Number(result[0]?.total || 0)
}
