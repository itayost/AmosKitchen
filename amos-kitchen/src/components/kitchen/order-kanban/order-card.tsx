// components/kitchen/order-kanban/order-card.tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { GripVertical, Clock, AlertTriangle, Info, CheckSquare, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CriticalPreferenceAlert, PreferenceBadgeGroup } from '@/components/customers/preference-badge'
import type { KitchenOrder, PreparationProgress } from '@/lib/types/kitchen'
import type { OrderStatus } from '@/lib/types/database'

interface OrderCardProps {
  order: KitchenOrder
  preparationProgress?: PreparationProgress
  onDishCheck?: (orderId: string, itemId: string, checked: boolean) => void
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => void
  isDragging?: boolean
}

export function OrderCard({
  order,
  preparationProgress = {},
  onDishCheck,
  onStatusChange,
  isDragging = false
}: OrderCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({
    id: order.id,
    data: {
      order,
      status: order.status
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const hasCriticalPreferences = order.customer.preferences?.some(
    p => p.type === 'ALLERGY' || p.type === 'MEDICAL'
  ) || false

  const areAllDishesPrepared = (): boolean => {
    const orderProgress = preparationProgress[order.id] || {}
    return order.orderItems.every(item => orderProgress[item.id] === true)
  }

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case 'NEW': return 'CONFIRMED'
      case 'CONFIRMED': return 'PREPARING'
      case 'PREPARING': return 'READY'
      case 'READY': return 'DELIVERED'
      default: return null
    }
  }

  const getStatusActionLabel = (status: OrderStatus) => {
    switch (status) {
      case 'NEW': return 'אשר הזמנה'
      case 'CONFIRMED': return 'התחל הכנה'
      case 'PREPARING': return 'סמן כמוכן'
      case 'READY': return 'סמן כנמסר'
      default: return 'עדכן סטטוס'
    }
  }

  const handleStatusButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextStatus = getNextStatus(order.status)
    if (nextStatus && onStatusChange) {
      onStatusChange(order.id, nextStatus)
    }
  }

  const canAdvanceStatus = order.status !== 'PREPARING' || areAllDishesPrepared()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-none",
        (isDragging || isSortableDragging) && "opacity-50"
      )}
    >
      <Card
        className={cn(
          "relative transition-all cursor-grab active:cursor-grabbing",
          hasCriticalPreferences && "border-2 border-red-400",
          (isDragging || isSortableDragging) && "shadow-lg ring-2 ring-primary"
        )}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          aria-label={`גרור הזמנה ${order.orderNumber}`}
          role="button"
          tabIndex={0}
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <CardHeader className="pb-3 pr-8">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base">
                הזמנה #{order.orderNumber}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {order.customer.name}
              </p>
            </div>
            {hasCriticalPreferences && (
              <Badge variant="destructive" className="animate-pulse">
                <AlertTriangle className="h-3 w-3 ml-1" />
                קריטי
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Critical Preferences Alert */}
          {order.customer.preferences && order.customer.preferences.length > 0 && (
            <div className="space-y-2">
              {hasCriticalPreferences && (
                <CriticalPreferenceAlert
                  preferences={order.customer.preferences}
                  className="text-xs"
                />
              )}

              {/* All Preferences */}
              <div className="p-2 bg-yellow-50 rounded-md border border-yellow-200">
                <p className="text-xs font-semibold text-yellow-800 mb-1 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  כל ההעדפות:
                </p>
                <PreferenceBadgeGroup
                  preferences={order.customer.preferences}
                  maxVisible={20}
                  showIcon={true}
                  className="gap-1"
                />
              </div>
            </div>
          )}

          <Separator />

          {/* Order Items - Show as checklist for PREPARING orders */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">פריטים:</h4>
            {order.status === 'PREPARING' && onDishCheck ? (
              // Checklist view for preparing orders
              <div className="space-y-2">
                {order.orderItems.map((item) => {
                  const isChecked = preparationProgress[order.id]?.[item.id] || false
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded transition-colors",
                        isChecked && "bg-green-50"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        id={`${order.id}-${item.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          onDishCheck(order.id, item.id, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`${order.id}-${item.id}`}
                        className={cn(
                          "flex-1 flex justify-between items-center cursor-pointer text-sm",
                          isChecked && "line-through text-muted-foreground"
                        )}
                      >
                        <span className="font-medium">{item.dish.name}</span>
                        <Badge variant="secondary" className="h-5">
                          x{item.quantity}
                        </Badge>
                      </label>
                    </div>
                  )
                })}
                {/* Progress indicator */}
                <div className="mt-2 text-xs text-muted-foreground text-center">
                  {Object.values(preparationProgress[order.id] || {}).filter(Boolean).length} מתוך {order.orderItems.length} מנות הוכנו
                </div>
              </div>
            ) : (
              // Regular view for other statuses
              order.orderItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="font-medium">{item.dish.name}</span>
                  <Badge variant="secondary" className="h-6">
                    x{item.quantity}
                  </Badge>
                </div>
              ))
            )}
          </div>

          {/* Order Notes */}
          {order.notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs font-semibold">הערות:</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {order.notes}
                </p>
              </div>
            </>
          )}

          {/* Time Info */}
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 ml-1" />
            <span>הוזמן ב-{format(new Date(order.createdAt), 'HH:mm')}</span>
          </div>
        </CardContent>

        {/* Status Action Button */}
        {getNextStatus(order.status) && onStatusChange && (
          <CardFooter className="pt-3">
            <Button
              className="w-full"
              size="sm"
              onClick={handleStatusButtonClick}
              disabled={!canAdvanceStatus}
            >
              {order.status === 'PREPARING' && !areAllDishesPrepared() ? (
                <span className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  יש להשלים את כל המנות
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {order.status === 'PREPARING' && <CheckSquare className="h-4 w-4" />}
                  {getStatusActionLabel(order.status)}
                </span>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

// Drag overlay version (simplified for performance)
export function OrderCardOverlay({ order }: { order: KitchenOrder }) {
  const hasCriticalPreferences = order.customer.preferences?.some(
    p => p.type === 'ALLERGY' || p.type === 'MEDICAL'
  ) || false

  return (
    <Card
      className={cn(
        "w-full shadow-xl cursor-grabbing opacity-90",
        hasCriticalPreferences && "border-2 border-red-400"
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          הזמנה #{order.orderNumber}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {order.customer.name}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          {order.orderItems.length} פריטים | ₪{order.totalAmount}
        </p>
      </CardContent>
    </Card>
  )
}
