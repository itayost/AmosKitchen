// components/kitchen/print-views/dish-checklist-print.tsx
'use client'

import { forwardRef, useMemo } from 'react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import type { KitchenOrder, DishAggregation } from '@/lib/types/kitchen'

interface DishChecklistPrintProps {
  orders: KitchenOrder[]
  fridayDate: Date
}

const categoryConfig: Record<string, { label: string; order: number }> = {
  APPETIZER: { label: 'מנות ראשונות', order: 1 },
  appetizer: { label: 'מנות ראשונות', order: 1 },
  MAIN: { label: 'מנות עיקריות', order: 2 },
  main: { label: 'מנות עיקריות', order: 2 },
  SIDE: { label: 'תוספות', order: 3 },
  side: { label: 'תוספות', order: 3 },
  DESSERT: { label: 'קינוחים', order: 4 },
  dessert: { label: 'קינוחים', order: 4 },
  BEVERAGE: { label: 'משקאות', order: 5 },
  beverage: { label: 'משקאות', order: 5 },
}

export const DishChecklistPrint = forwardRef<HTMLDivElement, DishChecklistPrintProps>(
  function DishChecklistPrint({ orders, fridayDate }, ref) {
    // Aggregate dishes from all active orders
    const dishAggregation = useMemo(() => {
      const dishMap = new Map<string, DishAggregation>()

      const activeOrders = orders.filter(order =>
        ['NEW', 'CONFIRMED', 'PREPARING', 'READY'].includes(order.status)
      )

      activeOrders.forEach(order => {
        order.orderItems.forEach(item => {
          const dishId = item.dish.id || item.dishId
          const dishName = item.dish.name

          if (!dishMap.has(dishId)) {
            dishMap.set(dishId, {
              id: dishId,
              name: dishName,
              category: item.dish.category || 'MAIN',
              totalQuantity: 0,
              orderCount: 0,
              orders: []
            })
          }

          const dish = dishMap.get(dishId)!
          dish.totalQuantity += item.quantity
          dish.orderCount += 1
          dish.orders.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customer.name,
            quantity: item.quantity,
            notes: (item.notes && item.notes.trim()) ? item.notes : (order.notes && order.notes.trim()) ? order.notes : undefined
          })
        })
      })

      return Array.from(dishMap.values())
    }, [orders])

    // Group by category and sort
    const dishesByCategory = useMemo(() => {
      const grouped = dishAggregation.reduce((acc, dish) => {
        const category = dish.category?.toUpperCase() || 'MAIN'
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(dish)
        return acc
      }, {} as Record<string, DishAggregation[]>)

      // Sort each category's dishes by name
      Object.keys(grouped).forEach(category => {
        grouped[category].sort((a, b) => a.name.localeCompare(b.name, 'he'))
      })

      // Sort categories by predefined order
      return Object.entries(grouped).sort((a, b) => {
        const orderA = categoryConfig[a[0]]?.order || 99
        const orderB = categoryConfig[b[0]]?.order || 99
        return orderA - orderB
      })
    }, [dishAggregation])

    const totalDishes = dishAggregation.reduce((sum, d) => sum + d.totalQuantity, 0)

    return (
      <div ref={ref} className="p-8 bg-white text-black print:p-4">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold mb-2">רשימת מנות להכנה</h1>
          <p className="text-lg">
            יום שישי, {format(fridayDate, 'd בMMMM yyyy', { locale: he })}
          </p>
          <p className="mt-2 text-gray-600">
            סה״כ: {totalDishes} מנות | {orders.filter(o => ['NEW', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status)).length} הזמנות
          </p>
        </div>

        {/* Dishes by Category */}
        {dishesByCategory.map(([category, dishes]) => {
          const config = categoryConfig[category] || { label: 'אחר', order: 99 }

          return (
            <div key={category} className="mb-8 print:break-inside-avoid">
              <h2 className="text-xl font-bold mb-4 bg-gray-100 p-2 rounded">
                {config.label}
              </h2>

              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-right p-2 w-8">✓</th>
                    <th className="text-right p-2">מנה</th>
                    <th className="text-center p-2 w-20">כמות</th>
                    <th className="text-right p-2">הערות</th>
                  </tr>
                </thead>
                <tbody>
                  {dishes.map(dish => {
                    const specialNotes = dish.orders
                      .filter(o => o.notes)
                      .map(o => `${o.customerName}: ${o.notes}`)

                    return (
                      <tr key={dish.id} className="border-b border-gray-200">
                        <td className="p-2 text-center">
                          <div className="w-5 h-5 border-2 border-gray-400 rounded" />
                        </td>
                        <td className="p-2 font-medium">{dish.name}</td>
                        <td className="p-2 text-center text-xl font-bold">
                          ×{dish.totalQuantity}
                        </td>
                        <td className="p-2 text-sm text-gray-600">
                          {specialNotes.length > 0 ? (
                            <ul className="list-disc list-inside">
                              {specialNotes.map((note, idx) => (
                                <li key={idx}>{note}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-500">
          <p>הודפס בתאריך: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}</p>
        </div>
      </div>
    )
  }
)
