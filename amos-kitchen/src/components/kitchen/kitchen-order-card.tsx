'use client'

import { Clock, AlertTriangle, Info, CheckSquare, Square, Truck, Store } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { CriticalPreferenceAlert, PreferenceBadgeGroup } from '@/components/customers/preference-badge'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { getNextStatus, getStatusActionLabel } from '@/lib/utils/order-status'
import type { Order, OrderStatus, Customer, CustomerPreference, OrderItem, Dish } from '@/lib/types/database'

interface KitchenOrderItem extends OrderItem {
  dish: Dish
}

export interface KitchenOrder extends Order {
  customer: Customer & {
    preferences?: CustomerPreference[]
  }
  orderItems: KitchenOrderItem[]
}

interface PreparationProgress {
  [itemId: string]: boolean
}

interface KitchenOrderCardProps {
  order: KitchenOrder
  isSelected: boolean
  onSelect: (orderId: string) => void
  preparationProgress: PreparationProgress
  onDishCheck: (orderId: string, itemId: string, checked: boolean) => void
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void
  onPreparationIncomplete: () => void
}

function hasCriticalPreferences(preferences?: CustomerPreference[]): boolean {
  return preferences?.some(p => p.type === 'ALLERGY' || p.type === 'MEDICAL') || false
}

function areAllDishesPrepared(order: KitchenOrder, progress: PreparationProgress): boolean {
  return order.orderItems.every(item => progress[item.id] === true)
}

export function KitchenOrderCard({
  order,
  isSelected,
  onSelect,
  preparationProgress,
  onDishCheck,
  onStatusChange,
  onPreparationIncomplete
}: KitchenOrderCardProps) {
  const nextStatus = getNextStatus(order.status)
  const allPrepared = areAllDishesPrepared(order, preparationProgress)
  const isPreparing = order.status === 'PREPARING'

  const handleStatusButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (nextStatus) {
      if (isPreparing && !allPrepared) {
        onPreparationIncomplete()
        return
      }
      onStatusChange(order.id, nextStatus)
    }
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all",
        isSelected && "ring-2 ring-primary",
        hasCriticalPreferences(order.customer.preferences) && "border-2 border-red-400"
      )}
      onClick={() => onSelect(order.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">
              הזמנה #{order.orderNumber}
            </CardTitle>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground truncate">
                {order.customer.name}
              </p>
              <Badge variant="outline" className="text-xs flex items-center gap-1 flex-shrink-0">
                {(order.deliveryMethod || 'DELIVERY') === 'DELIVERY' ? (
                  <><Truck className="h-3 w-3" />משלוח</>
                ) : (
                  <><Store className="h-3 w-3" />איסוף</>
                )}
              </Badge>
            </div>
          </div>
          {hasCriticalPreferences(order.customer.preferences) && (
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
            {hasCriticalPreferences(order.customer.preferences) && (
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
          {isPreparing ? (
            <PreparingItemsChecklist
              order={order}
              progress={preparationProgress}
              onDishCheck={onDishCheck}
            />
          ) : (
            <RegularItemsList items={order.orderItems} />
          )}
        </div>

        {/* Order Notes */}
        {order.notes && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="text-xs font-semibold">הערות:</p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
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

      <CardFooter className="pt-3">
        {nextStatus && (
          <Button
            className="w-full"
            size="sm"
            onClick={handleStatusButtonClick}
            disabled={isPreparing && !allPrepared}
          >
            {isPreparing && !allPrepared ? (
              <span className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                יש להשלים את כל המנות
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {isPreparing && <CheckSquare className="h-4 w-4" />}
                {getStatusActionLabel(order.status)}
              </span>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

// Sub-component for preparing items checklist
interface PreparingItemsChecklistProps {
  order: KitchenOrder
  progress: PreparationProgress
  onDishCheck: (orderId: string, itemId: string, checked: boolean) => void
}

function PreparingItemsChecklist({ order, progress, onDishCheck }: PreparingItemsChecklistProps) {
  const checkedCount = Object.values(progress).filter(Boolean).length

  return (
    <div className="space-y-2">
      {order.orderItems.map((item) => {
        const isChecked = progress[item.id] || false
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
        {checkedCount} מתוך {order.orderItems.length} מנות הוכנו
      </div>
    </div>
  )
}

// Sub-component for regular items list
interface RegularItemsListProps {
  items: KitchenOrderItem[]
}

function RegularItemsList({ items }: RegularItemsListProps) {
  return (
    <>
      {items.map((item, idx) => (
        <div key={idx} className="flex justify-between items-center text-sm">
          <span className="font-medium">{item.dish.name}</span>
          <Badge variant="secondary" className="h-6">
            x{item.quantity}
          </Badge>
        </div>
      ))}
    </>
  )
}
