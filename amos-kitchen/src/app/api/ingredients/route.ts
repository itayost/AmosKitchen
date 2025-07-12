// src/app/api/ingredients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for ingredient creation
const ingredientSchema = z.object({
    name: z.string().min(1, 'שם הרכיב הוא שדה חובה'),
    unit: z.enum(['kg', 'gram', 'liter', 'ml', 'unit']),
    minStock: z.number().optional(),
    currentStock: z.number().optional(),
    costPerUnit: z.number().optional(),
    supplier: z.string().optional(),
    category: z.enum(['vegetables', 'meat', 'dairy', 'grains', 'spices', 'other']).optional()
})

// Helper function to map frontend values to Prisma enum values
const mapToPrismaEnums = (data: any) => {
    const categoryMap: Record<string, string> = {
        'vegetables': 'VEGETABLES',
        'meat': 'MEAT',
        'dairy': 'DAIRY',
        'grains': 'GRAINS',
        'spices': 'SPICES',
        'other': 'OTHER'
    }

    const unitMap: Record<string, string> = {
        'kg': 'KG',
        'gram': 'GRAM',
        'liter': 'LITER',
        'ml': 'ML',
        'unit': 'UNIT'
    }

    return {
        ...data,
        category: data.category ? categoryMap[data.category] : 'OTHER',
        unit: unitMap[data.unit] || 'UNIT'  // Using 'unit' not 'unitOfMeasure'
    }
}

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
                dishIngredients: {
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
                        dishIngredients: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Transform data to include usage count and format for frontend
        const ingredientsWithStats = ingredients.map(ingredient => ({
            ...ingredient,
            dishCount: ingredient._count.dishIngredients,
            dishes: ingredient.dishIngredients.map(di => ({
                dish: di.dish
            })),
            // Convert enum values back to lowercase for frontend
            unit: ingredient.unit.toLowerCase(),
            category: ingredient.category.toLowerCase(),
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

        // Map frontend values to Prisma enum values
        const mappedData = mapToPrismaEnums(validatedData)

        const ingredient = await prisma.ingredient.create({
            data: {
                name: mappedData.name,
                unit: mappedData.unit,  // Using 'unit' field
                category: mappedData.category,
                minStock: mappedData.minStock,
                currentStock: mappedData.currentStock,
                costPerUnit: mappedData.costPerUnit,
                supplier: mappedData.supplier
            },
            include: {
                dishIngredients: {
                    include: {
                        dish: true
                    }
                },
                _count: {
                    select: {
                        dishIngredients: true
                    }
                }
            }
        })

        // Transform response to match frontend expectations
        const response = {
            ...ingredient,
            dishCount: ingredient._count.dishIngredients,
            dishes: ingredient.dishIngredients.map(di => ({
                dish: di.dish
            })),
            unit: ingredient.unit.toLowerCase(),
            category: ingredient.category.toLowerCase(),
            _count: undefined
        }

        return NextResponse.json(response, { status: 201 })
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

// GET /api/ingredients/categories - Get available categories
async function getCategories() {
    // Return the available categories from the enum
    return ['vegetables', 'meat', 'dairy', 'grains', 'spices', 'other']
}
