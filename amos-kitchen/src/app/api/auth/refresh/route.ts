// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase/admin'
import { auth } from '@/lib/firebase/config'

export async function POST(request: NextRequest) {
    try {
        // Get the current token from cookie
        const currentToken = request.cookies.get('firebase-auth-token')?.value

        if (!currentToken) {
            return NextResponse.json(
                { error: 'No authentication token found' },
                { status: 401 }
            )
        }

        // Verify the current token
        const decodedToken = await verifyIdToken(currentToken)

        if (!decodedToken) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            )
        }

        // Token is still valid, but we need to get a fresh one from the client
        // The client will need to send the new token
        const body = await request.json()
        const { idToken } = body

        if (!idToken) {
            return NextResponse.json(
                { error: 'No new token provided' },
                { status: 400 }
            )
        }

        // Verify the new token
        const newDecodedToken = await verifyIdToken(idToken)

        if (!newDecodedToken) {
            return NextResponse.json(
                { error: 'Invalid new token' },
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