// app/api/orders/export/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // TODO: Re-implement export functionality with Firestore
  return NextResponse.json(
    { error: 'Export functionality is being updated. Please try again later.' },
    { status: 503 }
  )
}