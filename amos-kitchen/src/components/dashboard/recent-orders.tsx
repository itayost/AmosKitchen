// src/components/dashboard/recent-orders.tsx
'use client'

import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { Eye, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'

interface RecentOrdersProps {
  orders: any[]
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(price)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>הזמנות אחרונות</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/orders">
            ראה הכל
            <ChevronRight className="mr-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>מספר הזמנה</TableHead>
              <TableHead>לקוח</TableHead>
              <TableHead>תאריך משלוח</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead className="text-right">סכום</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  {order.orderNumber}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.customer.phone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(order.deliveryDate), 'dd/MM/yyyy', { locale: he })}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status?.toUpperCase() || order.status} />
                </TableCell>
                <TableCell className="text-right">
                  {formatPrice(order.totalAmount)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <Link href={`/orders/${order.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  אין הזמנות להצגה
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
