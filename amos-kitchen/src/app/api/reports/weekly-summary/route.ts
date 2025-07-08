// src/app/api/reports/weekly-summary/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfWeek, endOfWeek, addDays } from 'date-fns'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const date = searchParams.get('date') || new Date().toISOString()

        // Get the Friday of the selected week
        const selectedDate = new Date(date)
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 }) // Sunday
        const friday = addDays(weekStart, 5)
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 })

        // Fetch all orders for the week
        const orders = await prisma.order.findMany({
            where: {
                deliveryDate: {
                    gte: weekStart,
                    lte: weekEnd
                }
            },
            include: {
                customer: true,
                orderItems: {
                    include: {
                        dish: {
                            include: {
                                ingredients: {
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
                { deliveryDate: 'asc' },
                { createdAt: 'asc' }
            ]
        })

        // Calculate statistics
        const totalOrders = orders.length
        const totalRevenue = orders.reduce((sum, order) =>
            sum + Number(order.totalAmount), 0
        )
        const uniqueCustomers = new Set(orders.map(o => o.customerId)).size

        // Orders by status
        const ordersByStatus = orders.reduce((acc, order) => {
            const status = order.status.toLowerCase()
            acc[status] = (acc[status] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        // Orders by day
        const ordersByDay = orders.reduce((acc, order) => {
            const day = order.deliveryDate.toISOString().split('T')[0]
            if (!acc[day]) {
                acc[day] = {
                    date: day,
                    count: 0,
                    revenue: 0,
                    dishes: {} as Record<string, number>
                }
            }
            acc[day].count++
            acc[day].revenue += Number(order.totalAmount)

            // Count dishes per day
            order.orderItems.forEach(item => {
                const dishName = item.dish.name
                acc[day].dishes[dishName] = (acc[day].dishes[dishName] || 0) + item.quantity
            })

            return acc
        }, {} as Record<string, any>)

        // Calculate dish popularity
        const dishStats = new Map<string, {
            dish: any
            quantity: number
            revenue: number
            orderCount: number
        }>()

        orders.forEach(order => {
            order.orderItems.forEach(item => {
                const dishId = item.dishId
                const existing = dishStats.get(dishId) || {
                    dish: item.dish,
                    quantity: 0,
                    revenue: 0,
                    orderCount: 0
                }
                existing.quantity += item.quantity
                existing.revenue += Number(item.price) * item.quantity
                existing.orderCount += 1
                dishStats.set(dishId, existing)
            })
        })

        const topDishes = Array.from(dishStats.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10)

        // Calculate ingredient requirements
        const ingredientRequirements = new Map<string, {
            ingredient: any
            totalQuantity: number
            unit: string
            dishes: Set<string>
        }>()

        orders.forEach(order => {
            order.orderItems.forEach(item => {
                const dish = item.dish
                dish.ingredients.forEach(dishIngredient => {
                    const ing = dishIngredient.ingredient
                    const quantity = dishIngredient.quantity * item.quantity

                    const existing = ingredientRequirements.get(ing.id) || {
                        ingredient: ing,
                        totalQuantity: 0,
                        unit: ing.unit,
                        dishes: new Set<string>()
                    }
                    existing.totalQuantity += quantity
                    existing.dishes.add(dish.name)
                    ingredientRequirements.set(ing.id, existing)
                })
            })
        })

        const ingredients = Array.from(ingredientRequirements.values())
            .map(item => ({
                ...item,
                dishes: Array.from(item.dishes)
            }))
            .sort((a, b) => a.ingredient.name.localeCompare(b.ingredient.name))

        // Customer analysis
        const customerStats = new Map<string, {
            customer: any
            orderCount: number
            totalSpent: number
            dishes: Map<string, number>
        }>()

        orders.forEach(order => {
            const customerId = order.customerId
            const existing = customerStats.get(customerId) || {
                customer: order.customer,
                orderCount: 0,
                totalSpent: 0,
                dishes: new Map<string, number>()
            }
            existing.orderCount++
            existing.totalSpent += Number(order.totalAmount)

            order.orderItems.forEach(item => {
                const count = existing.dishes.get(item.dish.name) || 0
                existing.dishes.set(item.dish.name, count + item.quantity)
            })

            customerStats.set(customerId, existing)
        })

        const topCustomers = Array.from(customerStats.values())
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10)
            .map(stat => ({
                ...stat,
                favoritesDishes: Array.from(stat.dishes.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([dish, count]) => ({ dish, count }))
            }))

        return NextResponse.json({
            weekOf: weekStart.toISOString(),
            friday: friday.toISOString(),
            summary: {
                totalOrders,
                totalRevenue,
                uniqueCustomers,
                averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                ordersByStatus,
                ordersByDay: Object.values(ordersByDay)
            },
            topDishes,
            topCustomers,
            ingredientRequirements: ingredients,
            orders: orders.map(order => ({
                ...order,
                totalAmount: Number(order.totalAmount)
            }))
        })
    } catch (error) {
        console.error('Error generating weekly summary:', error)
        return NextResponse.json(
            { error: 'Failed to generate weekly summary' },
            { status: 500 }
        )
    }
}
