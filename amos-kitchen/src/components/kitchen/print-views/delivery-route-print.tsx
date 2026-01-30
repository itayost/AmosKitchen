// components/kitchen/print-views/delivery-route-print.tsx
'use client'

import { forwardRef, useMemo } from 'react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import type { KitchenOrder } from '@/lib/types/kitchen'

interface DeliveryRoutePrintProps {
  orders: KitchenOrder[]
  fridayDate: Date
}

export const DeliveryRoutePrint = forwardRef<HTMLDivElement, DeliveryRoutePrintProps>(
  function DeliveryRoutePrint({ orders, fridayDate }, ref) {
    // Filter only READY orders and sort by address
    const deliveryOrders = useMemo(() => {
      return orders
        .filter(order => order.status === 'READY')
        .sort((a, b) => {
          const addressA = a.deliveryAddress || a.customer.address || ''
          const addressB = b.deliveryAddress || b.customer.address || ''
          return addressA.localeCompare(addressB, 'he')
        })
    }, [orders])

    if (deliveryOrders.length === 0) {
      return (
        <div ref={ref} className="p-8 bg-white text-black print:p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">רשימת משלוחים</h1>
            <p className="text-gray-500">אין הזמנות מוכנות למשלוח</p>
          </div>
        </div>
      )
    }

    return (
      <div ref={ref} className="p-8 bg-white text-black print:p-4">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold mb-2">רשימת משלוחים</h1>
          <p className="text-lg">
            יום שישי, {format(fridayDate, 'd בMMMM yyyy', { locale: he })}
          </p>
          <p className="mt-2 text-gray-600">
            סה״כ: {deliveryOrders.length} משלוחים
          </p>
        </div>

        {/* Delivery List */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300 bg-gray-100">
              <th className="text-right p-3 w-8">#</th>
              <th className="text-center p-3 w-8">✓</th>
              <th className="text-right p-3">הזמנה</th>
              <th className="text-right p-3">לקוח</th>
              <th className="text-right p-3">כתובת</th>
              <th className="text-right p-3 w-28">טלפון</th>
              <th className="text-right p-3">מנות</th>
            </tr>
          </thead>
          <tbody>
            {deliveryOrders.map((order, index) => {
              const address = order.deliveryAddress || order.customer.address || 'לא צוין'

              return (
                <tr
                  key={order.id}
                  className="border-b border-gray-200 print:break-inside-avoid"
                >
                  <td className="p-3 text-center font-bold text-gray-500">
                    {index + 1}
                  </td>
                  <td className="p-3 text-center">
                    <div className="w-5 h-5 border-2 border-gray-400 rounded mx-auto" />
                  </td>
                  <td className="p-3 font-medium">
                    #{order.orderNumber}
                  </td>
                  <td className="p-3">
                    {order.customer.name}
                  </td>
                  <td className="p-3">
                    <div className="max-w-[200px]">{address}</div>
                  </td>
                  <td className="p-3 font-mono text-sm" dir="ltr">
                    {order.customer.phone}
                  </td>
                  <td className="p-3 text-sm">
                    {order.orderItems.map((item, idx) => (
                      <div key={idx}>
                        {item.dish.name} ×{item.quantity}
                      </div>
                    ))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Summary */}
        <div className="mt-8 p-4 bg-gray-50 rounded">
          <h3 className="font-bold mb-2">סיכום:</h3>
          <p>סה״כ הזמנות: {deliveryOrders.length}</p>
          <p>
            סה״כ מנות:{' '}
            {deliveryOrders.reduce(
              (sum, order) =>
                sum + order.orderItems.reduce((s, item) => s + item.quantity, 0),
              0
            )}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-500">
          <p>הודפס בתאריך: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}</p>
        </div>
      </div>
    )
  }
)
