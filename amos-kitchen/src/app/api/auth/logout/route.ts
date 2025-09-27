// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { logOut } from '@/lib/firebase/auth'

export async function POST(request: NextRequest) {
    try {
        // Sign out from Firebase
        await logOut()

        // Create response
        const response = NextResponse.json({
            message: 'התנתקת בהצלחה'
        })

        // Clear the auth cookie
        response.cookies.set('firebase-auth-token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0, // Expire immediately
            path: '/'
        })

        return response

    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json(
            { error: 'שגיאה בהתנתקות' },
            { status: 500 }
        )
    }
}