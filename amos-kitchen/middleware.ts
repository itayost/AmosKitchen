// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()

    // Check if Supabase environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase environment variables are not set. Skipping authentication.')
        return res
    }

    try {
        const supabase = createMiddlewareClient({ req, res })

        const {
            data: { user },
        } = await supabase.auth.getUser()

        // If the user is not signed in and trying to access protected routes
        if (!user && !req.nextUrl.pathname.startsWith('/login') && !req.nextUrl.pathname.startsWith('/')) {
            return NextResponse.redirect(new URL('/login', req.url))
        }

        // If the user is signed in and trying to access login page
        if (user && req.nextUrl.pathname.startsWith('/login')) {
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }
    } catch (error) {
        console.error('Middleware error:', error)
    }

    return res
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
