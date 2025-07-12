// src/app/api/orders/today/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Get the next Friday (or current Friday if today is Friday)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Calculate days until Friday (5 = Friday in JS)
    const currentDay = today.getDay()
    let daysUntilFriday = (5 - currentDay + 7) % 7

    // If today is Friday and we haven't passed the cutoff time (e.g., 6 PM),
    // show today's orders. Otherwise, show next Friday's orders.
    if (currentDay === 5) {
      const now = new Date()
      const cutoffTime = new Date(today)
      cutoffTime.setHours(18, 0, 0, 0) // 6 PM cutoff

      if (now < cutoffTime) {
        daysUntilFriday = 0 // Show today's (Friday's) orders
      } else {
        daysUntilFriday = 7 // Show next Friday's orders
      }
    }

    // If daysUntilFriday is 0, we're already on Friday (before cutoff)
    if (daysUntilFriday === 0) {
      daysUntilFriday = 0
    }

    // Calculate the target Friday
    const targetFriday = new Date(today)
    targetFriday.setDate(today.getDate() + daysUntilFriday)
    targetFriday.setHours(0, 0, 0, 0)

    // Get the day after Friday for the range
    const dayAfterFriday = new Date(targetFriday)
    dayAfterFriday.setDate(targetFriday.getDate() + 1)

    console.log('Fetching orders for Friday:', targetFriday.toISOString())

    // Fetch orders for the target Friday
    const orders = await prisma.order.findMany({
      where: {
        deliveryDate: {
          gte: targetFriday,
          lt: dayAfterFriday
        },
        status: {
          not: 'CANCELLED'
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            notes: true
          }
        },
        orderItems: {
          include: {
            dish: {
              select: {
                id: true,
                name: true,
                category: true,
                price: true,
                description: true
              }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    // Return the array directly as the component expects
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Failed to fetch Friday orders:', error)

    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    // Return empty array on error to prevent component crashes
    return NextResponse.json([], { status: 500 })
  }
}
