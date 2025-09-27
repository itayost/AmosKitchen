// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyIdToken } from '@/lib/firebase/admin'

export async function middleware(req: NextRequest) {
    // Get the Firebase auth token from cookies
    const token = req.cookies.get('firebase-auth-token')?.value

    // Protected routes
    const protectedPaths = [
        '/dashboard',
        '/orders',
        '/customers',
        '/dishes',
        '/reports',
        '/settings',
        '/kitchen'
    ]

    const isProtectedPath = protectedPaths.some(path =>
        req.nextUrl.pathname.startsWith(path)
    )

    // Check authentication for protected routes
    if (isProtectedPath) {
        if (!token) {
            const redirectUrl = req.nextUrl.clone()
            redirectUrl.pathname = '/login'
            redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
            return NextResponse.redirect(redirectUrl)
        }

        // Verify the token with Firebase Admin SDK
        const decodedToken = await verifyIdToken(token)

        if (!decodedToken) {
            const redirectUrl = req.nextUrl.clone()
            redirectUrl.pathname = '/login'
            redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)

            // Clear invalid cookie
            const response = NextResponse.redirect(redirectUrl)
            response.cookies.set('firebase-auth-token', '', {
                maxAge: 0
            })
            return response
        }
    }

    // Redirect authenticated users from root to dashboard
    if (req.nextUrl.pathname === '/' && token) {
        const decodedToken = await verifyIdToken(token)
        if (decodedToken) {
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }
    }

    // Redirect authenticated users away from login/register pages
    if ((req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register') && token) {
        const decodedToken = await verifyIdToken(token)
        if (decodedToken) {
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}