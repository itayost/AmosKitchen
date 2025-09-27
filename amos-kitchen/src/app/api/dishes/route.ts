// src/app/api/dishes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createDish, getDishes } from '@/lib/firebase/dao/dishes'
import { verifyIdToken } from '@/lib/firebase/admin'

// Validation schema for dish creation
const dishSchema = z.object({
    name: z.string().min(1, 'שם המנה הוא שדה חובה'),
    description: z.string().optional(),
    price: z.number().positive('המחיר חייב להיות חיובי'),
    category: z.enum(['appetizer', 'main', 'side', 'dessert', 'beverage']),
    isAvailable: z.boolean().default(true)
})

// GET /api/dishes - Get all dishes with filters
export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const token = request.cookies.get('firebase-auth-token')?.value
        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const decodedToken = await verifyIdToken(token)
        if (!decodedToken) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            )
        }

        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''
        const category = searchParams.get('category')
        const available = searchParams.get('available')

        const dishes = await getDishes({
            search: search || undefined,
            category: category || undefined,
            available: available ? available === 'true' : undefined
        })

        // Transform data for frontend
        const dishesWithStats = dishes.map(dish => ({
            ...dish,
            category: dish.category?.toLowerCase() || 'main',
            price: Number(dish.price), // Ensure price is a number
            orderCount: 0, // We'll implement this later with aggregation
            // Convert timestamps to ISO strings for JSON serialization
            createdAt: dish.createdAt instanceof Date ? dish.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: dish.updatedAt instanceof Date ? dish.updatedAt.toISOString() : new Date().toISOString()
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
        const existingDishes = await getDishes({ search: validatedData.name })
        const existing = existingDishes.find(d =>
            d.name.toLowerCase() === validatedData.name.toLowerCase()
        )

        if (existing) {
            return NextResponse.json(
                { error: 'מנה עם שם זה כבר קיימת במערכת' },
                { status: 400 }
            )
        }

        // Create dish
        const dishId = await createDish({
            name: validatedData.name,
            description: validatedData.description || null,
            price: validatedData.price,
            category: validatedData.category.toUpperCase(),
            isAvailable: validatedData.isAvailable
        })

        // Get the created dish
        const dishes = await getDishes({})
        const createdDish = dishes.find(d => d.id === dishId)

        // Transform response for frontend
        const response = createdDish ? {
            ...createdDish,
            category: createdDish.category?.toLowerCase() || 'main',
            price: Number(createdDish.price)
        } : { id: dishId }

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