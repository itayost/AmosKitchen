// app/api/orders/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api/auth-middleware'

export async function GET(request: NextRequest) {
  // Verify authentication
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return auth.response
  }

  // TODO: Re-implement export functionality with Firestore
  return NextResponse.json(
    { error: 'Export functionality is being updated. Please try again later.' },
    { status: 503 }
  )
}