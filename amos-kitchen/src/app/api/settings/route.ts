// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSettings, updateSettings } from '@/lib/firebase/dao/settings'
import { verifyAuth } from '@/lib/api/auth-middleware'

const updateSettingsSchema = z.object({
    deliveryFee: z.number().min(0, 'דמי משלוח חייבים להיות 0 או יותר')
})

export async function GET(request: NextRequest) {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
        return auth.response
    }

    try {
        const settings = await getSettings()
        return NextResponse.json(settings)
    } catch (error) {
        console.error('Error fetching settings:', error)
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
        return auth.response
    }

    try {
        const body = await request.json()
        const validatedData = updateSettingsSchema.parse(body)

        await updateSettings(validatedData)

        const updated = await getSettings()
        return NextResponse.json(updated)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid data', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Error updating settings:', error)
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        )
    }
}
