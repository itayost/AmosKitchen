'use client'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { KitchenOrderCard, KitchenOrder } from './kitchen-order-card'
import { cn } from '@/lib/utils'
import { getStatusColor, STATUS_LABELS_HE } from '@/lib/utils/order-status'
import type { OrderStatus } from '@/lib/types/database'

interface PreparationProgress {
  [orderId: string]: {
    [itemId: string]: boolean
  }
}

interface OrderStatusColumnProps {
  status: OrderStatus
  orders: KitchenOrder[]
  selectedOrderId: string | null
  onSelectOrder: (orderId: string) => void
  preparationProgress: PreparationProgress
  onDishCheck: (orderId: string, itemId: string, checked: boolean) => void
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void
  onPreparationIncomplete: () => void
}

const STATUS_TITLES: Record<string, string> = {
  PREPARING: 'בהכנה',
  READY: 'מוכן למשלוח',
  DELIVERED: 'נמסר'
}

export function OrderStatusColumn({
  status,
  orders,
  selectedOrderId,
  onSelectOrder,
  preparationProgress,
  onDishCheck,
  onStatusChange,
  onPreparationIncomplete
}: OrderStatusColumnProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className={cn("w-3 h-3 rounded-full", getStatusColor(status))} />
        <h3 className="font-semibold">
          {STATUS_TITLES[status] || STATUS_LABELS_HE[status]}
        </h3>
        <Badge variant="outline">
          {orders.length}
        </Badge>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {orders.map(order => (
            <KitchenOrderCard
              key={order.id}
              order={order}
              isSelected={selectedOrderId === order.id}
              onSelect={onSelectOrder}
              preparationProgress={preparationProgress[order.id] || {}}
              onDishCheck={onDishCheck}
              onStatusChange={onStatusChange}
              onPreparationIncomplete={onPreparationIncomplete}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
