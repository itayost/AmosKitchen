// app/api/customers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { updateCustomerSchema } from '@/lib/validators/customer'
import { normalizePhoneNumber } from '@/lib/validators/customer'
import { Prisma } from '@prisma/client'

// Force this route to be dynamically rendered
export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: params.id },
            include: {
                orders: {
                    include: {
                        orderItems: {
                            include: {
                                dish: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                preferences: {
                    orderBy: {
                        type: 'asc'
                    }
                }
            }
        })

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }

        // Calculate statistics for the customer
        const orderCount = customer.orders.length
        const totalSpent = customer.orders.reduce(
            (sum, order) => sum + Number(order.totalAmount),
            0
        )

        // Calculate favorite dishes
        const dishCounts = new Map<string, { count: number; name: string }>()
        customer.orders.forEach(order => {
            order.orderItems.forEach(item => {
                const key = item.dishId
                if (dishCounts.has(key)) {
                    dishCounts.get(key)!.count += item.quantity
                } else {
                    dishCounts.set(key, { count: item.quantity, name: item.dish.name })
                }
            })
        })

        const favoriteDishes = Array.from(dishCounts.entries())
            .map(([dishId, data]) => ({
                dishId,
                dishName: data.name,
                totalOrdered: data.count
            }))
            .sort((a, b) => b.totalOrdered - a.totalOrdered)
            .slice(0, 5)

        const customerWithStats = {
            ...customer,
            orderCount,
            totalSpent,
            favoriteDishes
        }

        return NextResponse.json(customerWithStats)
    } catch (error) {
        console.error('Error fetching customer:', error)
        return NextResponse.json(
            { error: 'Failed to fetch customer' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()

        // Validate input
        const validatedData = updateCustomerSchema.parse(body)

        // Check if customer exists
        const existingCustomer = await prisma.customer.findUnique({
            where: { id: params.id },
            include: { preferences: true }
        })

        if (!existingCustomer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }

        // Prepare update data
        const updateData: any = {
            ...(validatedData.name && { name: validatedData.name.trim() }),
            ...(validatedData.email !== undefined && { email: validatedData.email?.trim() || null }),
            ...(validatedData.address !== undefined && { address: validatedData.address?.trim() || null }),
            ...(validatedData.notes !== undefined && { notes: validatedData.notes?.trim() || null })
        }

        // If phone is being updated, normalize and check if it's already in use
        if (validatedData.phone) {
            const normalizedPhone = normalizePhoneNumber(validatedData.phone)

            if (normalizedPhone !== existingCustomer.phone) {
                const phoneExists = await prisma.customer.findUnique({
                    where: { phone: normalizedPhone }
                })

                if (phoneExists) {
                    return NextResponse.json(
                        { error: 'מספר טלפון זה כבר קיים במערכת' },
                        { status: 400 }
                    )
                }

                updateData.phone = normalizedPhone
            }
        }

        // Handle preferences update if provided
        if (validatedData.preferences !== undefined) {
            // Start a transaction to update customer and preferences atomically
            const customer = await prisma.$transaction(async (tx) => {
                // Delete existing preferences
                await tx.customerPreference.deleteMany({
                    where: { customerId: params.id }
                })

                // Create new preferences
                const preferencesData = validatedData.preferences?.map(pref => ({
                    customerId: params.id,
                    type: pref.type,
                    value: pref.value.trim(),
                    notes: pref.notes?.trim() || null
                })) || []

                if (preferencesData.length > 0) {
                    await tx.customerPreference.createMany({
                        data: preferencesData
                    })
                }

                // Update customer
                return await tx.customer.update({
                    where: { id: params.id },
                    data: updateData,
                    include: {
                        preferences: {
                            orderBy: {
                                type: 'asc'
                            }
                        },
                        orders: {
                            include: {
                                orderItems: {
                                    include: {
                                        dish: true
                                    }
                                }
                            },
                            orderBy: {
                                createdAt: 'desc'
                            }
                        }
                    }
                })
            })

            return NextResponse.json(customer)
        } else {
            // Update customer without touching preferences
            const customer = await prisma.customer.update({
                where: { id: params.id },
                data: updateData,
                include: {
                    preferences: {
                        orderBy: {
                            type: 'asc'
                        }
                    },
                    orders: {
                        include: {
                            orderItems: {
                                include: {
                                    dish: true
                                }
                            }
                        },
                        orderBy: {
                            createdAt: 'desc'
                        }
                    }
                }
            })

            return NextResponse.json(customer)
        }
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
                    { error: 'העדפה כפולה - העדפה זו כבר קיימת עבור הלקוח' },
                    { status: 400 }
                )
            }
        }

        console.error('Error updating customer:', error)
        return NextResponse.json(
            { error: 'Failed to update customer' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check if customer exists
        const existingCustomer = await prisma.customer.findUnique({
            where: { id: params.id },
            include: {
                orders: true,
                preferences: true
            }
        })

        if (!existingCustomer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }

        // Check if customer has orders
        if (existingCustomer.orders.length > 0) {
            return NextResponse.json(
                { error: 'לא ניתן למחוק לקוח עם הזמנות קיימות' },
                { status: 400 }
            )
        }

        // Delete customer (preferences will be deleted automatically due to cascade)
        await prisma.customer.delete({
            where: { id: params.id }
        })

        return NextResponse.json({
            message: 'Customer deleted successfully',
            deletedPreferences: existingCustomer.preferences.length
        })
    } catch (error) {
        console.error('Error deleting customer:', error)
        return NextResponse.json(
            { error: 'Failed to delete customer' },
            { status: 500 }
        )
    }
}
