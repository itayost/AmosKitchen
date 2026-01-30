// components/kitchen/order-kanban/kanban-column.tsx
'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { OrderCard } from './order-card'
import type { KitchenOrder, KanbanColumnConfig, PreparationProgress } from '@/lib/types/kitchen'
import type { OrderStatus } from '@/lib/types/database'

interface KanbanColumnProps {
  config: KanbanColumnConfig
  orders: KitchenOrder[]
  preparationProgress: PreparationProgress
  onDishCheck: (orderId: string, itemId: string, checked: boolean) => void
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void
}

export function KanbanColumn({
  config,
  orders,
  preparationProgress,
  onDishCheck,
  onStatusChange
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: config.id,
    data: {
      column: config.id
    }
  })

  const orderIds = orders.map(order => order.id)

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border-2 border-dashed transition-colors min-h-[600px]",
        isOver ? "border-primary bg-primary/5" : "border-transparent"
      )}
    >
      {/* Column Header */}
      <div className={cn("p-3 rounded-t-lg", config.color)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded", config.textColor, "bg-white/50")}>
              <config.icon className="h-4 w-4" />
            </div>
            <h3 className={cn("font-semibold text-sm", config.textColor)}>
              {config.title}
            </h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {orders.length}
          </Badge>
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2"
      >
        <ScrollArea className="h-[550px]">
          <SortableContext
            items={orderIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 p-1">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                  <p>אין הזמנות</p>
                  <p className="text-xs mt-1">גרור הזמנה לכאן</p>
                </div>
              ) : (
                orders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    preparationProgress={preparationProgress}
                    onDishCheck={onDishCheck}
                    onStatusChange={onStatusChange}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </div>
    </div>
  )
}
