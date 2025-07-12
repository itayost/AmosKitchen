// src/app/api/dishes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for dish creation
const dishSchema = z.object({
    name: z.string().min(1, 'שם המנה הוא שדה חובה'),
    description: z.string().optional(),
    price: z.number().positive('המחיר חייב להיות חיובי'),
    category: z.enum(['appetizer', 'main', 'side', 'dessert', 'beverage']),
    isAvailable: z.boolean().default(true),
    ingredients: z.array(z.object({
        ingredientId: z.string(),
        quantity: z.number().positive(),
        notes: z.string().optional() // Using 'notes' based on your original code
    })).min(1, 'המנה חייבת להכיל לפחות רכיב אחד')
})

// Helper function to map frontend values to Prisma enum values
const mapCategoryToPrisma = (category: string): string => {
    const categoryMap: Record<string, string> = {
        'appetizer': 'APPETIZER',
        'main': 'MAIN',
        'side': 'SIDE',
        'dessert': 'DESSERT',
        'beverage': 'BEVERAGE'
    }
    return categoryMap[category.toLowerCase()] || 'MAIN'
}

// GET /api/dishes - Get all dishes with filters
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''
        const category = searchParams.get('category')
        const available = searchParams.get('available')

        const where = {
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { description: { contains: search, mode: 'insensitive' as const } }
                ]
            }),
            ...(category && category !== 'all' && {
                category: mapCategoryToPrisma(category)
            }),
            ...(available !== null && {
                isAvailable: available === 'true'
            })
        }

        const dishes = await prisma.dish.findMany({
            where,
            include: {
                ingredients: {  // Changed from dishIngredients to ingredients
                    include: {
                        ingredient: true
                    }
                },
                _count: {
                    select: {
                        orderItems: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        // Transform data for frontend
        const dishesWithStats = dishes.map(dish => ({
            ...dish,
            category: dish.category?.toLowerCase() || 'main',
            orderCount: dish._count.orderItems,
            _count: undefined
        }))

        return NextResponse.json(dishesWithStats)
    } catch (error) {
        console.error('Error fetching dishes:', error)
        return NextResponse.json(
            { error: 'Failed to fetch dishes' },
            { status: 500 }
        )
    }
}

// POST /api/dishes - Create a new dish
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = dishSchema.parse(body)

        // Check if dish with same name already exists
        const existing = await prisma.dish.findFirst({
            where: { name: validatedData.name }
        })

        if (existing) {
            return NextResponse.json(
                { error: 'מנה עם שם זה כבר קיימת במערכת' },
                { status: 400 }
            )
        }

        // First check which fields are available in DishIngredient
        // Based on the error, it seems 'notes' field doesn't exist
        // We'll create without the notes field
        const dish = await prisma.dish.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                price: validatedData.price,
                category: mapCategoryToPrisma(validatedData.category),
                isAvailable: validatedData.isAvailable,
                ingredients: {  // Changed from dishIngredients to ingredients
                    create: validatedData.ingredients.map(ingredient => ({
                        ingredientId: ingredient.ingredientId,
                        quantity: ingredient.quantity
                        // Removed 'notes' or 'preparation' field as it doesn't exist
                    }))
                }
            },
            include: {
                ingredients: {  // Changed from dishIngredients to ingredients
                    include: {
                        ingredient: true
                    }
                }
            }
        })

        // Transform response for frontend
        const response = {
            ...dish,
            category: dish.category?.toLowerCase() || 'main',
        }

        return NextResponse.json(response, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid data', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Error creating dish:', error)
        return NextResponse.json(
            { error: 'Failed to create dish' },
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
        const validatedData = dishSchema.parse(body)

        // Check if dish exists
        const existing = await prisma.dish.findUnique({
            where: { id: params.id }
        })

        if (!existing) {
            return NextResponse.json(
                { error: 'המנה לא נמצאה' },
                { status: 404 }
            )
        }

        // Update dish with ingredients
        const dish = await prisma.dish.update({
            where: { id: params.id },
            data: {
                name: validatedData.name,
                description: validatedData.description,
                price: validatedData.price,
                category: mapCategoryToPrisma(validatedData.category),
                isAvailable: validatedData.isAvailable,
                ingredients: {  // Changed from dishIngredients to ingredients
                    deleteMany: {}, // Remove all existing ingredients
                    create: validatedData.ingredients.map(ingredient => ({
                        ingredientId: ingredient.ingredientId,
                        quantity: ingredient.quantity
                        // Removed notes field
                    }))
                }
            },
            include: {
                ingredients: {  // Changed from dishIngredients to ingredients
                    include: {
                        ingredient: true
                    }
                }
            }
        })

        // Transform response for frontend
        const response = {
            ...dish,
            category: dish.category?.toLowerCase() || 'main',
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
        // Check if dish exists
        const existing = await prisma.dish.findUnique({
            where: { id: params.id },
            include: {
                orderItems: true
            }
        })

        if (!existing) {
            return NextResponse.json(
                { error: 'המנה לא נמצאה' },
                { status: 404 }
            )
        }

        // Check if dish is used in any orders
        if (existing.orderItems.length > 0) {
            return NextResponse.json(
                { error: 'לא ניתן למחוק מנה שקיימת בהזמנות' },
                { status: 400 }
            )
        }

        // Delete the dish (this will cascade delete dish_ingredients)
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
