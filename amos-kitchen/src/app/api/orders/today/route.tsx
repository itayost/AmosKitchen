import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await prisma.order.findMany({
      where: {
        deliveryDate: {
          gte: today,
          lt: tomorrow
        },
        status: {
          not: 'CANCELLED'
        }
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            dish: {
              include: {
                dishIngredients: {
                  include: {
                    ingredient: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Failed to fetch today\'s orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
