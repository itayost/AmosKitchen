// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    return NextResponse.json(
        { error: 'Registration is currently disabled' },
        { status: 503 }
    )
}
