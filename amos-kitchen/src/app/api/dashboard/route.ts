// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfWeek, endOfWeek, startOfDay, endOfDay, subDays, addDays } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const today = new Date()
    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)
    const weekStart = startOfWeek(today, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 })
    const nextFriday = addDays(weekStart, 5)
    const lastWeekStart = subDays(weekStart, 7)

    // Today's statistics
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            dish: true
          }
        }
      }
    })

    const todayStats = {
      orders: todayOrders.length,
      revenue: todayOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
      newCustomers: await prisma.customer.count({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd
          }
        }
      })
    }

    // Week statistics
    const weekOrders = await prisma.order.findMany({
      where: {
        deliveryDate: {
          gte: weekStart,
          lte: weekEnd
        }
      }
    })

    const weekStats = {
      orders: weekOrders.length,
      revenue: weekOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
      pendingOrders: weekOrders.filter(o =>
        ['NEW', 'CONFIRMED', 'PREPARING'].includes(o.status)
      ).length,
      completedOrders: weekOrders.filter(o => o.status === 'DELIVERED').length
    }

    // Friday orders (upcoming)
    const fridayOrders = await prisma.order.findMany({
      where: {
        deliveryDate: {
          gte: startOfDay(nextFriday),
          lte: endOfDay(nextFriday)
        }
      },
      include: {
        customer: true,
        orderItems: true
      }
    })

    const fridayStats = {
      orders: fridayOrders.length,
      revenue: fridayOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
      dishes: fridayOrders.reduce((sum, order) =>
        sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      )
    }

    // Recent activity
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        orderItems: {
          include: {
            dish: true
          }
        }
      }
    })

    const recentActivity = await prisma.orderHistory.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          include: {
            customer: true
          }
        }
      }
    })

    // Top dishes this week
    const topDishesQuery = await prisma.orderItem.groupBy({
      by: ['dishId'],
      where: {
        order: {
          deliveryDate: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      },
      _sum: {
        quantity: true
      },
      _count: {
        dishId: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    })

    const dishIds = topDishesQuery.map(item => item.dishId)
    const dishes = await prisma.dish.findMany({
      where: { id: { in: dishIds } }
    })

    const topDishes = topDishesQuery.map(item => {
      const dish = dishes.find(d => d.id === item.dishId)
      return {
        dish,
        quantity: item._sum.quantity || 0,
        orderCount: item._count.dishId
      }
    })

    // Low stock ingredients
    const lowStockIngredients = await prisma.ingredient.findMany({
      where: {
        AND: [
          { currentStock: { not: null } },
          { minStock: { not: null } }
        ]
      },
      orderBy: {
        currentStock: 'asc'
      }
    })

    const lowStock = lowStockIngredients
      .filter(ing => ing.currentStock! < ing.minStock!)
      .slice(0, 5)

    // Customer insights
    const totalCustomers = await prisma.customer.count()
    const activeCustomers = await prisma.customer.count({
      where: {
        orders: {
          some: {
            createdAt: {
              gte: subDays(today, 30)
            }
          }
        }
      }
    })

    // Chart data - last 7 days
    const chartData = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)

      const dayOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      })

      chartData.push({
        date: date.toISOString(),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
      })
    }

    // Comparison with last week
    const lastWeekOrders = await prisma.order.findMany({
      where: {
        deliveryDate: {
          gte: lastWeekStart,
          lt: weekStart
        }
      }
    })

    const lastWeekRevenue = lastWeekOrders.reduce((sum, order) =>
      sum + Number(order.totalAmount), 0
    )

    const comparison = {
      revenueChange: weekStats.revenue - lastWeekRevenue,
      revenueChangePercent: lastWeekRevenue > 0
        ? ((weekStats.revenue - lastWeekRevenue) / lastWeekRevenue * 100).toFixed(1)
        : 0,
      ordersChange: weekStats.orders - lastWeekOrders.length,
      ordersChangePercent: lastWeekOrders.length > 0
        ? ((weekStats.orders - lastWeekOrders.length) / lastWeekOrders.length * 100).toFixed(1)
        : 0
    }

    return NextResponse.json({
      today: todayStats,
      week: weekStats,
      friday: fridayStats,
      recentOrders,
      recentActivity,
      topDishes,
      lowStock,
      customers: {
        total: totalCustomers,
        active: activeCustomers
      },
      chartData,
      comparison
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
