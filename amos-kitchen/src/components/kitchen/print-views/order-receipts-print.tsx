// components/kitchen/print-views/order-receipts-print.tsx
'use client'

import { forwardRef } from 'react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import type { KitchenOrder } from '@/lib/types/kitchen'

interface OrderReceiptsPrintProps {
  orders: KitchenOrder[]
  fridayDate: Date
}

export const OrderReceiptsPrint = forwardRef<HTMLDivElement, OrderReceiptsPrintProps>(
  function OrderReceiptsPrint({ orders, fridayDate }, ref) {
    // Filter orders that should have receipts (ready or about to be delivered)
    const receiptOrders = orders.filter(order =>
      ['READY', 'PREPARING', 'CONFIRMED'].includes(order.status)
    )

    if (receiptOrders.length === 0) {
      return (
        <div ref={ref} className="p-8 bg-white text-black print:p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">קבלות הזמנה</h1>
            <p className="text-gray-500">אין הזמנות להדפסה</p>
          </div>
        </div>
      )
    }

    return (
      <div ref={ref} className="bg-white text-black">
        {receiptOrders.map((order, index) => (
          <div
            key={order.id}
            className={`p-8 print:p-4 ${index > 0 ? 'print:break-before-page' : ''}`}
          >
            {/* Receipt Header */}
            <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
              <h1 className="text-2xl font-bold mb-1">מטבח עמוס</h1>
              <p className="text-gray-600">קבלת הזמנה</p>
            </div>

            {/* Order Info */}
            <div className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-bold">הזמנה #{order.orderNumber}</p>
                  <p className="text-sm text-gray-600">
                    {format(fridayDate, 'EEEE, d בMMMM yyyy', { locale: he })}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500">
                    הוזמן: {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="font-bold">{order.customer.name}</p>
              <p className="text-sm" dir="ltr">{order.customer.phone}</p>
              {(order.deliveryAddress || order.customer.address) && (
                <p className="text-sm text-gray-600">
                  {order.deliveryAddress || order.customer.address}
                </p>
              )}
            </div>

            {/* Preferences Warning */}
            {order.customer.preferences && order.customer.preferences.some(p => p.type === 'ALLERGY' || p.type === 'MEDICAL') && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="font-bold text-red-700">⚠️ שים לב:</p>
                {order.customer.preferences
                  .filter(p => p.type === 'ALLERGY' || p.type === 'MEDICAL')
                  .map((pref, idx) => (
                    <p key={idx} className="text-sm text-red-600">
                      {pref.type === 'ALLERGY' ? '🚨 אלרגיה' : '⚕️ רפואי'}: {pref.value}
                    </p>
                  ))
                }
              </div>
            )}

            {/* Order Items */}
            <table className="w-full mb-4">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-right py-2">פריט</th>
                  <th className="text-center py-2 w-16">כמות</th>
                  <th className="text-left py-2 w-20">מחיר</th>
                </tr>
              </thead>
              <tbody>
                {order.orderItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2">
                      <div>{item.dish.name}</div>
                      {item.notes && (
                        <div className="text-xs text-gray-500">📝 {item.notes}</div>
                      )}
                    </td>
                    <td className="text-center py-2">×{item.quantity}</td>
                    <td className="text-left py-2">₪{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total */}
            <div className="border-t-2 border-gray-300 pt-3">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>סה״כ לתשלום:</span>
                <span>₪{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="font-bold text-sm">הערות להזמנה:</p>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-dashed border-gray-300 text-center text-xs text-gray-400">
              <p>תודה שבחרתם במטבח עמוס!</p>
              <p>בתאבון 🍽️</p>
            </div>
          </div>
        ))}
      </div>
    )
  }
)
