// app/api/customers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Force this route to be dynamically rendered
export const dynamic = 'force-dynamic'

// Validation schema for updating customer
const updateCustomerSchema = z.object({
    // Validation schema for updating customer
    const updateCustomerSchema = z.object({
        name: z.string().min(2).optional(),
        phone: z.string().min(9).optional(),
        email: z.string().email().nullable().optional(),
        address: z.string().nullable().optional(),
        notes: z.string().nullable().optional()
    })

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
                }
            }
        })

        if(!customer) {
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

        const customerWithStats = {
            ...customer,
            orderCount,
            totalSpent
        }

        return NextResponse.json(customerWithStats)
    } catch(error) {
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
            where: { id: params.id }
        })

        if (!existingCustomer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }

        // If phone is being updated, check if it's already in use
        if (validatedData.phone && validatedData.phone !== existingCustomer.phone) {
            const phoneExists = await prisma.customer.findUnique({
                where: { phone: validatedData.phone }
            })

            if (phoneExists) {
                return NextResponse.json(
                    { error: 'מספר טלפון זה כבר קיים במערכת' },
                    { status: 400 }
                )
            }
        }

        // Update customer
        const customer = await prisma.customer.update({
            where: { id: params.id },
            data: validatedData,
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
                }
            }
        })

        return NextResponse.json(customer)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            )
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
                orders: true
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

        // Delete customer
        await prisma.customer.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ message: 'Customer deleted successfully' })
    } catch (error) {
        console.error('Error deleting customer:', error)
        return NextResponse.json(
            { error: 'Failed to delete customer' },
            { status: 500 }
        )
    }
}
