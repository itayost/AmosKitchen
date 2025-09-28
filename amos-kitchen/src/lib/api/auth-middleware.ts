// lib/api/auth-middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase/admin'

export async function verifyAuth(request: NextRequest) {
    const token = request.cookies.get('firebase-auth-token')?.value

    if (!token) {
        return {
            authenticated: false,
            response: NextResponse.json(
                { error: 'Unauthorized - No token provided' },
                { status: 401 }
            )
        }
    }

    try {
        const decodedToken = await verifyIdToken(token)

        if (!decodedToken) {
            return {
                authenticated: false,
                response: NextResponse.json(
                    { error: 'Unauthorized - Invalid token' },
                    { status: 401 }
                )
            }
        }

        return {
            authenticated: true,
            user: decodedToken
        }
    } catch (error) {
        console.error('Auth verification error:', error)
        return {
            authenticated: false,
            response: NextResponse.json(
                { error: 'Unauthorized - Token verification failed' },
                { status: 401 }
            )
        }
    }
}