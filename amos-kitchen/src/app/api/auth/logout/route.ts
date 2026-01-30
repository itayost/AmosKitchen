// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { logOut } from '@/lib/firebase/auth'
import { AUTH_CONFIG } from '@/lib/constants/auth'

export async function POST(request: NextRequest) {
    try {
        // Sign out from Firebase
        await logOut()

        // Create response
        const response = NextResponse.json({
            message: 'התנתקת בהצלחה'
        })

        // Clear the auth cookie
        response.cookies.set(AUTH_CONFIG.AUTH_COOKIE_NAME, '', {
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