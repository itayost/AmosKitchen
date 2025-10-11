// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase/admin'
import { auth } from '@/lib/firebase/config'

export async function POST(request: NextRequest) {
    try {
        // Get the new token from the request body
        // We don't validate the old cookie - it may be expired, which is why we're refreshing
        const body = await request.json()
        const { idToken } = body

        if (!idToken) {
            return NextResponse.json(
                { error: 'No new token provided' },
                { status: 400 }
            )
        }

        // Verify the new token from Firebase client
        const decodedToken = await verifyIdToken(idToken)

        if (!decodedToken) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            )
        }

        // Create response with new token in cookie
        const response = NextResponse.json({
            success: true,
            message: 'Token refreshed successfully'
        })

        // Set the new token as an HTTP-only cookie
        response.cookies.set('firebase-auth-token', idToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        })

        return response

    } catch (error) {
        console.error('Token refresh error:', error)
        return NextResponse.json(
            { error: 'Failed to refresh token' },
            { status: 500 }
        )
    }
}