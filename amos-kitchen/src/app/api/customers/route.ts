// app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for creating customer
const createCustomerSchema = z.object({
    name: z.string().min(2),
    phone: z.string().min(9),
    email: z.string().email().nullable().optional(),
    address: z.string().nullable().optional(),
    notes: z.string().nullable().optional()
})

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search')

        // Build where clause for search
        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { phone: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
                { address: { contains: search, mode: 'insensitive' as const } }
            ]
        } : {}

        // Fetch customers with order statistics
        const customers = await prisma.customer.findMany({
            where,
            include: {
                orders: {
                    select: {
                        id: true,
                        totalAmount: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Transform data to include statistics
        const customersWithStats = customers.map(customer => {
            const orderCount = customer.orders.length
            const totalSpent = customer.orders.reduce(
                (sum, order) => sum + Number(order.totalAmount),
                0
            )
            const lastOrderDate = customer.orders.length > 0
                ? customer.orders.reduce((latest, order) =>
                    order.createdAt > latest ? order.createdAt : latest,
                    customer.orders[0].createdAt
                )
                : null

            return {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                address: customer.address,
                notes: customer.notes,
                createdAt: customer.createdAt,
                updatedAt: customer.updatedAt,
                orderCount,
                totalSpent,
                lastOrderDate
            }
        })

        return NextResponse.json(customersWithStats)
    } catch (error) {
        console.error('Error fetching customers:', error)
        return NextResponse.json(
            { error: 'Failed to fetch customers' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate input
        const validatedData = createCustomerSchema.parse(body)

        // Check if phone number already exists
        const existingCustomer = await prisma.customer.findUnique({
            where: { phone: validatedData.phone }
        })

        if (existingCustomer) {
            return NextResponse.json(
                { error: 'מספר טלפון זה כבר קיים במערכת' },
                { status: 400 }
            )
        }

        // Create customer
        const customer = await prisma.customer.create({
            data: validatedData
        })

        return NextResponse.json(customer, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Error creating customer:', error)
        return NextResponse.json(
            { error: 'Failed to create customer' },
            { status: 500 }
        )
    }
}
