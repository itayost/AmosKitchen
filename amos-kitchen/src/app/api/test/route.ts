// app/api/test/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection
    const customerCount = await prisma.customer.count()
    const orderCount = await prisma.order.count()
    
    return NextResponse.json({
      success: true,
      data: {
        customers: customerCount,
        orders: orderCount,
        database: 'connected'
      }
    })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      database: 'disconnected'
    }, { status: 500 })
  }
}
