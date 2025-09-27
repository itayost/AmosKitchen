// app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
    try {
        // Get token from request body or cookie
        const body = await request.json().catch(() => ({}))
        const token = body.token || request.cookies.get('firebase-auth-token')?.value

        if (!token) {
            return NextResponse.json(
                { valid: false, error: 'No token provided' },
                { status: 401 }
            )
        }

        // Verify the token with Firebase Admin SDK
        const decodedToken = await verifyIdToken(token)

        if (!decodedToken) {
            return NextResponse.json(
                { valid: false, error: 'Invalid token' },
                { status: 401 }
            )
        }

        return NextResponse.json({
            valid: true,
            user: {
                uid: decodedToken.uid,
                email: decodedToken.email,
            }
        })

    } catch (error) {
        console.error('Token verification error:', error)
        return NextResponse.json(
            { valid: false, error: 'Token verification failed' },
            { status: 500 }
        )
    }
}