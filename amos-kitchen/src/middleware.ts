// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

    // Skip API routes and static files
    if (req.nextUrl.pathname.startsWith('/api/') ||
        req.nextUrl.pathname.startsWith('/_next/') ||
        req.nextUrl.pathname.startsWith('/static/')) {
        return NextResponse.next()
    }

    // Check authentication for protected routes
    if (isProtectedPath) {
        if (!token) {
            const redirectUrl = req.nextUrl.clone()
            redirectUrl.pathname = '/login'
            redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
            return NextResponse.redirect(redirectUrl)
        }

        // For now, we'll just check if token exists
        // The actual verification will happen in the page/API route
        // This avoids Edge Runtime issues with Firebase Admin SDK
    }

    // Redirect authenticated users from root to dashboard
    if (req.nextUrl.pathname === '/' && token) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Redirect authenticated users away from login/register pages
    if ((req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register') && token) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}