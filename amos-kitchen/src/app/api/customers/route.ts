// app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { createCustomerSchema } from '@/lib/validators/customer'
import { normalizePhoneNumber } from '@/lib/validators/customer'
import { Prisma } from '@prisma/client'

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

        // Fetch customers with order statistics and preferences
        const customers = await prisma.customer.findMany({
            where,
            include: {
                orders: {
                    select: {
                        id: true,
                        totalAmount: true,
                        createdAt: true
                    }
                },
                preferences: {
                    orderBy: {
                        type: 'asc' as const
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
                preferences: customer.preferences,
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

        // Validate input using the imported schema
        const validatedData = createCustomerSchema.parse(body)

        // Normalize phone number
        const normalizedPhone = normalizePhoneNumber(validatedData.phone)

        // Check if phone number already exists
        const existingCustomer = await prisma.customer.findUnique({
            where: { phone: normalizedPhone }
        })

        if (existingCustomer) {
            return NextResponse.json(
                { error: 'מספר טלפון זה כבר קיים במערכת' },
                { status: 400 }
            )
        }

        // Prepare preferences data if provided
        const preferencesData = validatedData.preferences?.map(pref => ({
            type: pref.type,
            value: pref.value.trim(),
            notes: pref.notes?.trim() || null
        })) || []

        // Create customer with preferences
        const customer = await prisma.customer.create({
            data: {
                name: validatedData.name.trim(),
                phone: normalizedPhone,
                email: validatedData.email?.trim() || null,
                address: validatedData.address?.trim() || null,
                notes: validatedData.notes?.trim() || null,
                preferences: {
                    create: preferencesData
                }
            },
            include: {
                preferences: true
            }
        })

        return NextResponse.json(customer, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            )
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return NextResponse.json(
                    { error: 'לקוח עם פרטים דומים כבר קיים במערכת' },
                    { status: 400 }
                )
            }
        }

        console.error('Error creating customer:', error)
        return NextResponse.json(
            { error: 'Failed to create customer' },
            { status: 500 }
        )
    }
}
