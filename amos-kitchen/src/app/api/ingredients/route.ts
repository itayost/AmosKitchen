// src/app/api/ingredients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for ingredient creation
const ingredientSchema = z.object({
    name: z.string().min(1, 'שם הרכיב הוא שדה חובה'),
    unit: z.string().min(1, 'יחידת מידה היא שדה חובה'),
    minStock: z.number().optional(),
    currentStock: z.number().optional(),
    costPerUnit: z.number().optional(),
    supplier: z.string().optional(),
    category: z.string().optional()
})

// GET /api/ingredients - Get all ingredients with optional filters
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''
        const category = searchParams.get('category')

        const where = {
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { supplier: { contains: search, mode: 'insensitive' as const } }
                ]
            }),
            ...(category && { category })
        }

        const ingredients = await prisma.ingredient.findMany({
            where,
            include: {
                dishes: {
                    include: {
                        dish: {
                            select: {
                                id: true,
                                name: true,
                                isAvailable: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        dishes: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        })

        // Transform data to include usage count
        const ingredientsWithStats = ingredients.map(ingredient => ({
            ...ingredient,
            dishCount: ingredient._count.dishes,
            _count: undefined
        }))

        return NextResponse.json(ingredientsWithStats)
    } catch (error) {
        console.error('Error fetching ingredients:', error)
        return NextResponse.json(
            { error: 'Failed to fetch ingredients' },
            { status: 500 }
        )
    }
}

// POST /api/ingredients - Create a new ingredient
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = ingredientSchema.parse(body)

        // Check if ingredient with same name already exists
        const existing = await prisma.ingredient.findUnique({
            where: { name: validatedData.name }
        })

        if (existing) {
            return NextResponse.json(
                { error: 'רכיב עם שם זה כבר קיים במערכת' },
                { status: 400 }
            )
        }

        const ingredient = await prisma.ingredient.create({
            data: {
                name: validatedData.name,
                unit: validatedData.unit,
                minStock: validatedData.minStock,
                currentStock: validatedData.currentStock,
                costPerUnit: validatedData.costPerUnit,
                supplier: validatedData.supplier,
                category: validatedData.category
            }
        })

        return NextResponse.json(ingredient, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid data', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Error creating ingredient:', error)
        return NextResponse.json(
            { error: 'Failed to create ingredient' },
            { status: 500 }
        )
    }
}

// GET /api/ingredients/categories - Get unique categories
export async function getCategories() {
    try {
        const categories = await prisma.ingredient.findMany({
            select: { category: true },
            distinct: ['category'],
            where: { category: { not: null } }
        })

        return categories.map(c => c.category).filter(Boolean)
    } catch (error) {
        console.error('Error fetching categories:', error)
        return []
    }
}
