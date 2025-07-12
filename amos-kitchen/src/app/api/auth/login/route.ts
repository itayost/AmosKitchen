// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email('אימייל לא תקין'),
    password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים')
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate input
        const { email, password } = loginSchema.parse(body)

        // Create Supabase client
        const cookieStore = cookies()
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            return NextResponse.json(
                { error: 'אימייל או סיסמה שגויים' },
                { status: 401 }
            )
        }

        return NextResponse.json({
            user: data.user,
            message: 'התחברת בהצלחה'
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'שגיאה בהתחברות' },
            { status: 500 }
        )
    }
}
