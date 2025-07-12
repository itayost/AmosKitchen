// app/api/orders/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const dateRange = searchParams.get('dateRange') || 'all'

    // Build where clause (same as orders route)
    const where: any = {}

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } }
      ]
    }

    if (status !== 'all') {
      where.status = status
    }

    if (dateRange !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      switch (dateRange) {
        case 'today':
          where.deliveryDate = {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
          break
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          where.deliveryDate = {
            gte: weekAgo,
            lte: now
          }
          break
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          where.deliveryDate = {
            gte: monthAgo,
            lte: now
          }
          break
      }
    }

    // Fetch all orders (no pagination for export)
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        orderItems: {
          include: {
            dish: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform data for export
    const exportData = orders.map(order => ({
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      customerEmail: order.customer.email || '',
      deliveryDate: format(new Date(order.deliveryDate), 'dd/MM/yyyy'),
      deliveryAddress: order.deliveryAddress || '',
      totalAmount: order.totalAmount,
      status: order.status,
      itemsCount: order.orderItems.length,
      items: order.orderItems.map(item => ({
        dishName: item.dish.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * Number(item.price),
        notes: item.notes || ''
      })),
      notes: order.notes || '',
      createdAt: format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm'),
      updatedAt: format(new Date(order.updatedAt), 'dd/MM/yyyy HH:mm')
    }))

    return NextResponse.json({ orders: exportData })
  } catch (error) {
    console.error('Error exporting orders:', error)
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    )
  }
}
