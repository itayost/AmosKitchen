// src/app/api/reports/shopping-list/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfWeek, endOfWeek, addDays } from 'date-fns'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const date = searchParams.get('date') || new Date().toISOString()
        const groupBy = searchParams.get('groupBy') || 'category' // category | supplier | all

        // Get the Friday of the selected week
        const selectedDate = new Date(date)
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 })
        const friday = addDays(weekStart, 5)
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 })

        // Fetch all orders for the week that are not cancelled
        const orders = await prisma.order.findMany({
            where: {
                deliveryDate: {
                    gte: weekStart,
                    lte: weekEnd
                },
                status: {
                    not: 'CANCELLED'
                }
            },
            include: {
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
            }
        })

        // Calculate total ingredient requirements
        const ingredientMap = new Map<string, {
            ingredient: any
            totalQuantity: number
            unit: string
            usedInDishes: Map<string, number>
            orderCount: number
        }>()

        orders.forEach(order => {
            order.orderItems.forEach(item => {
                const dish = item.dish

                dish.ingredients.forEach(dishIngredient => {
                    const ing = dishIngredient.ingredient
                    const quantity = dishIngredient.quantity * item.quantity

                    const existing = ingredientMap.get(ing.id) || {
                        ingredient: ing,
                        totalQuantity: 0,
                        unit: ing.unit,
                        usedInDishes: new Map<string, number>(),
                        orderCount: 0
                    }

                    existing.totalQuantity += quantity
                    existing.orderCount++

                    // Track which dishes use this ingredient
                    const dishCount = existing.usedInDishes.get(dish.name) || 0
                    existing.usedInDishes.set(dish.name, dishCount + item.quantity)

                    ingredientMap.set(ing.id, existing)
                })
            })
        })

        // Convert to array and add additional info
        const allIngredients = Array.from(ingredientMap.values()).map(item => ({
            id: item.ingredient.id,
            name: item.ingredient.name,
            category: item.ingredient.category || 'אחר',
            supplier: item.ingredient.supplier || 'לא מוגדר',
            unit: item.unit,
            unitLabel: getUnitLabel(item.unit),
            totalQuantity: Math.round(item.totalQuantity * 100) / 100, // Round to 2 decimals
            currentStock: item.ingredient.currentStock || 0,
            minStock: item.ingredient.minStock || 0,
            costPerUnit: item.ingredient.costPerUnit || 0,
            estimatedCost: item.totalQuantity * (item.ingredient.costPerUnit || 0),
            orderCount: item.orderCount,
            usedInDishes: Array.from(item.usedInDishes.entries()).map(([dish, count]) => ({
                dish,
                count
            })).sort((a, b) => b.count - a.count),
            needToBuy: calculateNeedToBuy(
                item.totalQuantity,
                item.ingredient.currentStock || 0
            ),
            lowStock: item.ingredient.currentStock < item.ingredient.minStock
        }))

        // Group ingredients based on request
        let groupedIngredients: any = {}

        if (groupBy === 'category') {
            groupedIngredients = allIngredients.reduce((acc, ing) => {
                const category = ing.category
                if (!acc[category]) {
                    acc[category] = {
                        name: getCategoryLabel(category),
                        ingredients: [],
                        totalCost: 0
                    }
                }
                acc[category].ingredients.push(ing)
                acc[category].totalCost += ing.estimatedCost
                return acc
            }, {} as Record<string, any>)
        } else if (groupBy === 'supplier') {
            groupedIngredients = allIngredients.reduce((acc, ing) => {
                const supplier = ing.supplier
                if (!acc[supplier]) {
                    acc[supplier] = {
                        name: supplier,
                        ingredients: [],
                        totalCost: 0
                    }
                }
                acc[supplier].ingredients.push(ing)
                acc[supplier].totalCost += ing.estimatedCost
                return acc
            }, {} as Record<string, any>)
        }

        // Calculate summary statistics
        const summary = {
            totalIngredients: allIngredients.length,
            totalEstimatedCost: allIngredients.reduce((sum, ing) => sum + ing.estimatedCost, 0),
            lowStockItems: allIngredients.filter(ing => ing.lowStock).length,
            totalOrders: orders.length,
            categoryCounts: allIngredients.reduce((acc, ing) => {
                acc[ing.category] = (acc[ing.category] || 0) + 1
                return acc
            }, {} as Record<string, number>),
            supplierCounts: allIngredients.reduce((acc, ing) => {
                acc[ing.supplier] = (acc[ing.supplier] || 0) + 1
                return acc
            }, {} as Record<string, number>)
        }

        return NextResponse.json({
            weekOf: weekStart.toISOString(),
            deliveryDate: friday.toISOString(),
            summary,
            ingredients: groupBy === 'all' ? allIngredients : groupedIngredients,
            groupBy,
            orderCount: orders.length
        })
    } catch (error) {
        console.error('Error generating shopping list:', error)
        return NextResponse.json(
            { error: 'Failed to generate shopping list' },
            { status: 500 }
        )
    }
}

// Helper functions
function getUnitLabel(unit: string): string {
    const units: Record<string, string> = {
        kg: 'ק"ג',
        gram: 'גרם',
        liter: 'ליטר',
        ml: 'מ"ל',
        unit: 'יחידה'
    }
    return units[unit] || unit
}

function getCategoryLabel(category: string): string {
    const categories: Record<string, string> = {
        vegetables: 'ירקות',
        fruits: 'פירות',
        meat: 'בשר',
        dairy: 'חלב',
        grains: 'דגנים',
        spices: 'תבלינים',
        oils: 'שמנים',
        other: 'אחר'
    }
    return categories[category] || category
}

function calculateNeedToBuy(required: number, currentStock: number): number {
    const needed = required - currentStock
    return needed > 0 ? Math.round(needed * 100) / 100 : 0
}
