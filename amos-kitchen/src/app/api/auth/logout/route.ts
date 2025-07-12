// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies()
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

        const { error } = await supabase.auth.signOut()

        if (error) {
            return NextResponse.json(
                { error: 'שגיאה בהתנתקות' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            message: 'התנתקת בהצלחה'
        })

    } catch (error) {
        return NextResponse.json(
            { error: 'שגיאה בהתנתקות' },
            { status: 500 }
        )
    }
}
