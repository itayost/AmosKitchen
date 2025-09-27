// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { signUp } from '@/lib/firebase/auth'

const registerSchema = z.object({
    email: z.string().email('אימייל לא תקין'),
    password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
    name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים').optional()
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate input
        const { email, password, name } = registerSchema.parse(body)

        // Sign up with Firebase
        const { user, error } = await signUp(email, password, name)

        if (error || !user) {
            // Check for specific Firebase errors
            if (error?.includes('email-already-in-use')) {
                return NextResponse.json(
                    { error: 'כתובת האימייל כבר רשומה במערכת' },
                    { status: 400 }
                )
            }

            return NextResponse.json(
                { error: error || 'שגיאה ביצירת החשבון' },
                { status: 400 }
            )
        }

        // Get the ID token for the user
        const idToken = await user.getIdToken()

        // Create response with token in cookie
        const response = NextResponse.json({
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
            },
            message: 'החשבון נוצר בהצלחה'
        })

        // Set the token as an HTTP-only cookie
        response.cookies.set('firebase-auth-token', idToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        })

        return response

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }

        console.error('Register error:', error)
        return NextResponse.json(
            { error: 'שגיאה ביצירת החשבון' },
            { status: 500 }
        )
    }
}