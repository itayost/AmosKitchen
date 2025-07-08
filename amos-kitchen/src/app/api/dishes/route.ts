// src/app/api/dishes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for dish creation/update
const dishSchema = z.object({
    name: z.string().min(1, 'שם המנה הוא שדה חובה'),
    description: z.string().optional(),
    price: z.number().positive('מחיר חייב להיות חיובי'),
    category: z.string().min(1, 'קטגוריה היא שדה חובה'),
    isAvailable: z.boolean().default(true),
    ingredients: z.array(z.object({
        ingredientId: z.string(),
        quantity: z.number().positive(),
        notes: z.string().optional()
    })).optional()
})

// GET /api/dishes - Get all dishes with optional filters
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
            ...(category && { category }),
            ...(available !== null && { isAvailable: available === 'true' })
        }

        const dishes = await prisma.dish.findMany({
            where,
            include: {
                ingredients: {
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
            orderBy: [
                { category: 'asc' },
                { name: 'asc' }
            ]
        })

        // Transform the data to include order count
        const dishesWithStats = dishes.map(dish => ({
            ...dish,
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

        // Create dish with ingredients if provided
        const dish = await prisma.dish.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                price: validatedData.price,
                category: validatedData.category,
                isAvailable: validatedData.isAvailable,
                ingredients: validatedData.ingredients ? {
                    create: validatedData.ingredients.map(ing => ({
                        ingredientId: ing.ingredientId,
                        quantity: ing.quantity,
                        notes: ing.notes
                    }))
                } : undefined
            },
            include: {
                ingredients: {
                    include: {
                        ingredient: true
                    }
                }
            }
        })

        return NextResponse.json(dish, { status: 201 })
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
