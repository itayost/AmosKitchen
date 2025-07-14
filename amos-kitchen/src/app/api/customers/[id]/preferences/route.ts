// app/api/customers/[id]/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { customerPreferenceSchema } from '@/lib/validators/customer'
import { Prisma } from '@prisma/client'

// Get all preferences for a customer
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const preferences = await prisma.customerPreference.findMany({
            where: { customerId: params.id },
            orderBy: [
                { type: 'asc' },
                { value: 'asc' }
            ]
        })

        return NextResponse.json(preferences)
    } catch (error) {
        console.error('Error fetching preferences:', error)
        return NextResponse.json(
            { error: 'Failed to fetch preferences' },
            { status: 500 }
        )
    }
}

// Add a new preference
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const validatedData = customerPreferenceSchema.parse(body)

        // Check if customer exists
        const customer = await prisma.customer.findUnique({
            where: { id: params.id }
        })

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }

        // Create preference
        const preference = await prisma.customerPreference.create({
            data: {
                customerId: params.id,
                type: validatedData.type,
                value: validatedData.value.trim(),
                notes: validatedData.notes?.trim() || null
            }
        })

        return NextResponse.json(preference, { status: 201 })
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
                    { error: 'העדפה זו כבר קיימת עבור הלקוח' },
                    { status: 400 }
                )
            }
        }

        console.error('Error creating preference:', error)
        return NextResponse.json(
            { error: 'Failed to create preference' },
            { status: 500 }
        )
    }
}

// Update a specific preference
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { preferenceId, ...updateData } = body

        if (!preferenceId) {
            return NextResponse.json(
                { error: 'Preference ID is required' },
                { status: 400 }
            )
        }

        const validatedData = customerPreferenceSchema.partial().parse(updateData)

        // Check if preference exists and belongs to the customer
        const existingPreference = await prisma.customerPreference.findFirst({
            where: {
                id: preferenceId,
                customerId: params.id
            }
        })

        if (!existingPreference) {
            return NextResponse.json(
                { error: 'Preference not found' },
                { status: 404 }
            )
        }

        // Update preference
        const preference = await prisma.customerPreference.update({
            where: { id: preferenceId },
            data: {
                ...(validatedData.type && { type: validatedData.type }),
                ...(validatedData.value && { value: validatedData.value.trim() }),
                ...(validatedData.notes !== undefined && { notes: validatedData.notes?.trim() || null })
            }
        })

        return NextResponse.json(preference)
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
                    { error: 'העדפה זו כבר קיימת עבור הלקוח' },
                    { status: 400 }
                )
            }
        }

        console.error('Error updating preference:', error)
        return NextResponse.json(
            { error: 'Failed to update preference' },
            { status: 500 }
        )
    }
}

// Delete a specific preference
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url)
        const preferenceId = searchParams.get('preferenceId')

        if (!preferenceId) {
            return NextResponse.json(
                { error: 'Preference ID is required' },
                { status: 400 }
            )
        }

        // Check if preference exists and belongs to the customer
        const existingPreference = await prisma.customerPreference.findFirst({
            where: {
                id: preferenceId,
                customerId: params.id
            }
        })

        if (!existingPreference) {
            return NextResponse.json(
                { error: 'Preference not found' },
                { status: 404 }
            )
        }

        // Delete preference
        await prisma.customerPreference.delete({
            where: { id: preferenceId }
        })

        return NextResponse.json({ message: 'Preference deleted successfully' })
    } catch (error) {
        console.error('Error deleting preference:', error)
        return NextResponse.json(
            { error: 'Failed to delete preference' },
            { status: 500 }
        )
    }
}
