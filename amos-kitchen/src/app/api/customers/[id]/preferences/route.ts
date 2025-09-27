// app/api/customers/[id]/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { customerPreferenceSchema } from '@/lib/validators/customer'
import {
    getCustomerById,
    getCustomerPreferences,
    addCustomerPreference,
    deleteCustomerPreference
} from '@/lib/firebase/dao/customers'
import { doc, updateDoc } from 'firebase/firestore'
import { customerPreferencesCollection, getServerTimestamp } from '@/lib/firebase/firestore'

// Get all preferences for a customer
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const preferences = await getCustomerPreferences(params.id)

        // Sort preferences by type and value
        preferences.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type.localeCompare(b.type)
            }
            return a.value.localeCompare(b.value)
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
        const customer = await getCustomerById(params.id)

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }

        // Check if preference already exists
        const existingPreferences = await getCustomerPreferences(params.id)
        const duplicate = existingPreferences.find(
            p => p.type === validatedData.type && p.value === validatedData.value.trim()
        )

        if (duplicate) {
            return NextResponse.json(
                { error: 'העדפה זו כבר קיימת עבור הלקוח' },
                { status: 400 }
            )
        }

        // Create preference
        const preferenceId = await addCustomerPreference(params.id, {
            type: validatedData.type,
            value: validatedData.value.trim(),
            notes: validatedData.notes?.trim() || null
        })

        const preference = {
            id: preferenceId,
            customerId: params.id,
            type: validatedData.type,
            value: validatedData.value.trim(),
            notes: validatedData.notes?.trim() || null
        }

        return NextResponse.json(preference, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            )
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
        const existingPreferences = await getCustomerPreferences(params.id)
        const existingPreference = existingPreferences.find(p => p.id === preferenceId)

        if (!existingPreference) {
            return NextResponse.json(
                { error: 'Preference not found' },
                { status: 404 }
            )
        }

        // Update preference in Firestore
        const prefDocRef = doc(customerPreferencesCollection(params.id), preferenceId)
        const updatePayload: any = {
            updatedAt: getServerTimestamp()
        }

        if (validatedData.type) updatePayload.type = validatedData.type
        if (validatedData.value) updatePayload.value = validatedData.value.trim()
        if (validatedData.notes !== undefined) updatePayload.notes = validatedData.notes?.trim() || null

        await updateDoc(prefDocRef, updatePayload)

        const updatedPreference = {
            ...existingPreference,
            ...updatePayload,
            updatedAt: new Date()
        }

        return NextResponse.json(updatedPreference)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            )
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
        const existingPreferences = await getCustomerPreferences(params.id)
        const existingPreference = existingPreferences.find(p => p.id === preferenceId)

        if (!existingPreference) {
            return NextResponse.json(
                { error: 'Preference not found' },
                { status: 404 }
            )
        }

        // Delete preference
        await deleteCustomerPreference(params.id, preferenceId)

        return NextResponse.json({ message: 'Preference deleted successfully' })
    } catch (error) {
        console.error('Error deleting preference:', error)
        return NextResponse.json(
            { error: 'Failed to delete preference' },
            { status: 500 }
        )
    }
}
