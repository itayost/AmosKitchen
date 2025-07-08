// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startOfWeek, endOfWeek, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    const sevenDaysAgo = subDays(now, 7);

    // Fetch all data in parallel
    const [
      totalOrders,
      activeCustomers,
      revenueData,
      recentOrdersData
    ] = await Promise.all([
      // Total orders this week
      prisma.order.count({
        where: {
          createdAt: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      }),

      // Active customers this week
      prisma.customer.count({
        where: {
          orders: {
            some: {
              createdAt: {
                gte: weekStart,
                lte: weekEnd
              }
            }
          }
        }
      }),

      // Revenue this week
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: weekStart,
            lte: weekEnd
          },
          status: {
            not: 'CANCELLED'
          }
        },
        _sum: {
          totalAmount: true
        }
      }),

      // Recent orders
      prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          customer: true
        }
      })
    ]);

    // Get weekly orders using Prisma ORM instead of raw query
    const ordersThisWeek = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      select: {
        createdAt: true
      }
    });

    // Group orders by day
    const ordersByDay = ordersThisWeek.reduce((acc, order) => {
      const day = order.createdAt.toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get top dishes using Prisma ORM
    const topDishesRaw = await prisma.orderItem.groupBy({
      by: ['dishId'],
      where: {
        order: {
          createdAt: {
            gte: weekStart
          }
        }
      },
      _count: {
        dishId: true
      },
      orderBy: {
        _count: {
          dishId: 'desc'
        }
      },
      take: 5
    });

    // Get dish details for top dishes
    const dishIds = topDishesRaw.map(item => item.dishId);
    const dishes = await prisma.dish.findMany({
      where: {
        id: {
          in: dishIds
        }
      }
    });

    const dishMap = dishes.reduce((acc, dish) => {
      acc[dish.id] = dish.name;
      return acc;
    }, {} as Record<string, string>);

    const topDishes = topDishesRaw.map(item => ({
      name: dishMap[item.dishId] || 'Unknown',
      count: item._count.dishId
    }));

    // Calculate average order value
    const revenue = Number(revenueData._sum.totalAmount) || 0;
    const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

    // Format weekly orders data
    const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const weeklyOrders = daysOfWeek.map((day, index) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + index);
      const dateStr = date.toISOString().split('T')[0];
      return {
        day,
        orders: ordersByDay[dateStr] || 0
      };
    });

    // Format recent orders
    const recentOrders = recentOrdersData.map(order => ({
      id: order.id,
      customer: order.customer.name,
      amount: Number(order.totalAmount),
      status: order.status.toLowerCase(),
      time: getRelativeTime(order.createdAt)
    }));

    return NextResponse.json({
      stats: {
        totalOrders,
        activeCustomers,
        revenue: Math.round(revenue),
        avgOrderValue: Math.round(avgOrderValue)
      },
      weeklyOrders,
      recentOrders,
      topDishes
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 60) {
    return `לפני ${diffInMinutes} דקות`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `לפני ${hours} ${hours === 1 ? 'שעה' : 'שעות'}`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `לפני ${days} ${days === 1 ? 'יום' : 'ימים'}`;
  }
}
