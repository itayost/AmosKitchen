// components/kitchen/order-kanban/kanban-board.tsx
'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useToast } from '@/lib/hooks/use-toast'
import { KanbanColumn } from './kanban-column'
import { OrderCardOverlay } from './order-card'
import { KANBAN_COLUMNS, type KitchenOrder, type PreparationProgress } from '@/lib/types/kitchen'
import type { OrderStatus } from '@/lib/types/database'

interface KanbanBoardProps {
  groupedOrders: Record<OrderStatus, KitchenOrder[]>
  preparationProgress: PreparationProgress
  onDishCheck: (orderId: string, itemId: string, checked: boolean) => void
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>
}

export function KanbanBoard({
  groupedOrders,
  preparationProgress,
  onDishCheck,
  onStatusChange,
}: KanbanBoardProps) {
  const [activeOrder, setActiveOrder] = useState<KitchenOrder | null>(null)
  const { toast } = useToast()

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px minimum drag distance to start
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms touch hold before drag starts
        tolerance: 5, // 5px movement allowed during delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Find order by ID across all columns
  const findOrderById = useCallback((orderId: string): KitchenOrder | null => {
    for (const orders of Object.values(groupedOrders)) {
      const order = orders.find(o => o.id === orderId)
      if (order) return order
    }
    return null
  }, [groupedOrders])

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const order = findOrderById(active.id as string)
    setActiveOrder(order)
  }, [findOrderById])

  // Handle drag over (for visual feedback)
  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Visual feedback is handled by CSS in KanbanColumn via isOver
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveOrder(null)

    if (!over) return

    const orderId = active.id as string
    const order = findOrderById(orderId)

    if (!order) return

    // Determine the target column
    let targetStatus: OrderStatus | null = null

    // Check if dropped on a column directly
    if (KANBAN_COLUMNS.some(col => col.id === over.id)) {
      targetStatus = over.id as OrderStatus
    }
    // Check if dropped on another order (get its column)
    else {
      const targetOrder = findOrderById(over.id as string)
      if (targetOrder) {
        targetStatus = targetOrder.status
      }
    }

    if (!targetStatus) return

    // Skip if same status
    if (order.status === targetStatus) return

    // Validate PREPARING → READY transition
    if (order.status === 'PREPARING' && targetStatus === 'READY') {
      const orderProgress = preparationProgress[orderId] || {}
      const allPrepared = order.orderItems.every(item => orderProgress[item.id] === true)

      if (!allPrepared) {
        toast({
          title: 'לא ניתן לסמן כמוכן',
          description: 'יש לסמן את כל המנות כמוכנות לפני סימון ההזמנה כמוכנה',
          variant: 'destructive',
        })
        return
      }
    }

    // Perform the status change
    try {
      await onStatusChange(orderId, targetStatus)
    } catch (error) {
      // Error toast is handled in the hook
      console.error('Failed to update order status:', error)
    }
  }, [findOrderById, onStatusChange, preparationProgress, toast])

  // Handle status change from button click
  const handleStatusChangeFromButton = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    const order = findOrderById(orderId)

    if (!order) return

    // Validate PREPARING → READY transition
    if (order.status === 'PREPARING' && newStatus === 'READY') {
      const orderProgress = preparationProgress[orderId] || {}
      const allPrepared = order.orderItems.every(item => orderProgress[item.id] === true)

      if (!allPrepared) {
        toast({
          title: 'לא ניתן לסמן כמוכן',
          description: 'יש לסמן את כל המנות כמוכנות לפני סימון ההזמנה כמוכנה',
          variant: 'destructive',
        })
        return
      }
    }

    try {
      await onStatusChange(orderId, newStatus)
    } catch (error) {
      console.error('Failed to update order status:', error)
    }
  }, [findOrderById, onStatusChange, preparationProgress, toast])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {KANBAN_COLUMNS.map(config => (
          <KanbanColumn
            key={config.id}
            config={config}
            orders={groupedOrders[config.id] || []}
            preparationProgress={preparationProgress}
            onDishCheck={onDishCheck}
            onStatusChange={handleStatusChangeFromButton}
          />
        ))}
      </div>

      {/* Drag Overlay - shows the card being dragged */}
      <DragOverlay>
        {activeOrder && (
          <div className="w-[280px]">
            <OrderCardOverlay order={activeOrder} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
