// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { signIn } from '@/lib/firebase/auth'

const loginSchema = z.object({
    email: z.string().email('אימייל לא תקין'),
    password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים')
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate input
        const { email, password } = loginSchema.parse(body)

        // Sign in with Firebase
        const { user, error } = await signIn(email, password)

        if (error || !user) {
            return NextResponse.json(
                { error: error || 'אימייל או סיסמה שגויים' },
                { status: 401 }
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
            message: 'התחברת בהצלחה'
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

        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'שגיאה בהתחברות' },
            { status: 500 }
        )
    }
}