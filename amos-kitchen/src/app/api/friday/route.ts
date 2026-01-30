// src/app/api/friday/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, endOfDay } from 'date-fns'
import { query, where, getDocs } from 'firebase/firestore'
import { ordersCollection, dateToTimestamp } from '@/lib/firebase/firestore'
import { verifyAuth } from '@/lib/api/auth-middleware'
import { OrderStatus } from '@/lib/types/database'
import {
  THURSDAY_CUTOFF_HOUR,
  FRIDAY_DELIVERY_CUTOFF_HOUR,
  CUTOFF_WARNING_HOURS
} from '@/lib/constants/friday'

export const dynamic = 'force-dynamic'

type FridayStatus = 'open' | 'cutoff-soon' | 'closed'

// Calculate the next available Friday based on current time and cutoffs
function getNextAvailableFriday(): Date {
  const now = new Date()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const currentDay = today.getDay()
  let daysUntilFriday = (5 - currentDay + 7) % 7

  // If today is Thursday after cutoff, skip to next Friday
  if (currentDay === 4) {
    const cutoffTime = new Date(today)
    cutoffTime.setHours(THURSDAY_CUTOFF_HOUR, 0, 0, 0)
    if (now >= cutoffTime) {
      daysUntilFriday = 8 // Next Friday (skip this week)
    } else {
      daysUntilFriday = 1 // Tomorrow (Friday)
    }
  }

  // If today is Friday, check if before delivery cutoff
  if (currentDay === 5) {
    const cutoffTime = new Date(today)
    cutoffTime.setHours(FRIDAY_DELIVERY_CUTOFF_HOUR, 0, 0, 0)
    if (now >= cutoffTime) {
      daysUntilFriday = 7 // Next Friday
    } else {
      daysUntilFriday = 0 // Today
    }
  }

  // If it's Saturday or Sunday, calculate days to next Friday
  if (currentDay === 6) daysUntilFriday = 6
  if (currentDay === 0) daysUntilFriday = 5

  const nextFriday = new Date(today)
  nextFriday.setDate(today.getDate() + daysUntilFriday)
  return nextFriday
}

// Determine the ordering status based on cutoff times
function getFridayStatus(targetFriday: Date): FridayStatus {
  const now = new Date()

  // Calculate Thursday cutoff before the target Friday
  const thursdayCutoff = new Date(targetFriday)
  thursdayCutoff.setDate(targetFriday.getDate() - 1) // Thursday
  thursdayCutoff.setHours(THURSDAY_CUTOFF_HOUR, 0, 0, 0)

  // If we're past the Friday itself, it's closed
  const fridayEnd = endOfDay(targetFriday)
  if (now > fridayEnd) {
    return 'closed'
  }

  // If we're past Thursday 6 PM cutoff
  if (now >= thursdayCutoff) {
    return 'closed'
  }

  // If we're within warning period of cutoff
  const warningTime = new Date(thursdayCutoff)
  warningTime.setHours(thursdayCutoff.getHours() - CUTOFF_WARNING_HOURS)
  if (now >= warningTime) {
    return 'cutoff-soon'
  }

  return 'open'
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return auth.response
    }

    const targetFriday = getNextAvailableFriday()
    const fridayStart = startOfDay(targetFriday)
    const fridayEnd = endOfDay(targetFriday)

    // Query orders for the target Friday
    const fridayOrdersQuery = query(
      ordersCollection,
      where('deliveryDate', '>=', dateToTimestamp(fridayStart)),
      where('deliveryDate', '<=', dateToTimestamp(fridayEnd))
    )

    const fridayOrders: any[] = []
    try {
      const snapshot = await getDocs(fridayOrdersQuery)
      snapshot.forEach(doc => {
        const data = doc.data()
        // Exclude cancelled orders
        const cancelledStatus: OrderStatus = 'CANCELLED'
        if (data.status !== cancelledStatus) {
          fridayOrders.push({ id: doc.id, ...data })
        }
      })
    } catch (error: any) {
      // Handle permission errors gracefully (e.g., during build)
      if (error?.code !== 'permission-denied') {
        console.error('Failed to fetch Friday orders:', error)
      }
    }

    // Calculate aggregated stats
    const orderCount = fridayOrders.length
    const revenue = fridayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    const dishCount = fridayOrders.reduce((sum, order) => {
      if (!order.items) return sum
      return sum + order.items.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0)
    }, 0)

    const status = getFridayStatus(targetFriday)

    return NextResponse.json({
      date: targetFriday.toISOString(),
      orderCount,
      dishCount,
      revenue,
      status
    })
  } catch (error) {
    console.error('Error fetching Friday stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Friday stats' },
      { status: 500 }
    )
  }
}
