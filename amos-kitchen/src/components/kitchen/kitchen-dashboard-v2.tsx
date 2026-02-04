// src/components/kitchen/kitchen-dashboard-v2.tsx
// Phase 3: Kitchen Command Center with Kanban board and real-time updates
'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, ClipboardList, ChefHat, Calendar, AlertTriangle, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

// New Phase 3 components
import { useKitchenOrders } from '@/lib/hooks/use-kitchen-orders'
import { KanbanBoard } from '@/components/kitchen/order-kanban'
import { KitchenSummaryStats } from '@/components/kitchen/kitchen-summary-stats'
import { BatchCookingView } from '@/components/kitchen/batch-cooking-view'

import type { KitchenOrder } from '@/lib/types/kitchen'
import type { OrderStatus } from '@/lib/types/database'

interface KitchenDashboardV2Props {
  // initialOrders can be used for SSR hydration in future
  initialOrders?: KitchenOrder[]
  deliveryDate?: Date | null
}

export function KitchenDashboardV2({
  deliveryDate
}: KitchenDashboardV2Props) {
  const [viewMode, setViewMode] = useState<'kanban' | 'dishes'>('kanban')

  // Use the real-time orders hook
  const {
    orders,
    groupedOrders,
    stats,
    isLoading,
    error,
    isConnected,
    updateOrderStatus,
    preparationProgress,
    setPreparationProgress,
    refetch
  } = useKitchenOrders({
    deliveryDate: deliveryDate || undefined,
  })

  // Handle dish preparation checkbox
  const handleDishCheck = useCallback((orderId: string, itemId: string, checked: boolean) => {
    setPreparationProgress(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [itemId]: checked
      }
    }))
  }, [setPreparationProgress])

  // Handle status change (from drag-and-drop or button click)
  const handleStatusChange = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus)
    } catch (error) {
      // Error is handled in the hook
      console.error('Failed to update status:', error)
    }
  }, [updateOrderStatus])

  // Check for critical preferences
  const hasCriticalPreferences = (preferences?: { type: string }[]) => {
    return preferences?.some(p => p.type === 'ALLERGY' || p.type === 'MEDICAL') || false
  }

  // Prepare data for dish view (batch cooking)
  const dishAggregation = orders
    .filter(order => ['PREPARING', 'READY'].includes(order.status))
    .reduce((acc, order) => {
      order.orderItems.forEach(item => {
        const dishId = item.dish.id || item.dishId
        if (!acc[dishId]) {
          acc[dishId] = {
            id: dishId,
            name: item.dish.name,
            category: item.dish.category || 'MAIN',
            totalQuantity: 0,
            orderCount: 0,
            orders: []
          }
        }
        acc[dishId].totalQuantity += item.quantity
        acc[dishId].orderCount += 1
        acc[dishId].orders.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customer.name,
          quantity: item.quantity,
          notes: item.notes || order.notes || undefined
        })
      })
      return acc
    }, {} as Record<string, {
      id: string
      name: string
      category: string
      totalQuantity: number
      orderCount: number
      orders: {
        orderId: string
        orderNumber: string
        customerName: string
        quantity: number
        notes?: string
      }[]
    }>)

  const dishes = Object.values(dishAggregation)

  // Get the effective date (from hook or prop)
  const effectiveDate = deliveryDate || new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">לוח מטבח</h1>
            <div className="flex items-center gap-2 mt-2 text-lg text-muted-foreground">
              <Calendar className="h-5 w-5" />
              <span>הזמנות ליום {format(effectiveDate, 'EEEE, d בMMMM yyyy', { locale: he })}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <Badge variant={isConnected ? 'default' : 'destructive'} className="gap-1">
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3" />
                  מחובר
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  לא מחובר
                </>
              )}
            </Badge>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={refetch}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border w-fit">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="flex items-center gap-2"
          >
            <ClipboardList className="h-4 w-4" />
            לוח קנבן
          </Button>
          <Button
            variant={viewMode === 'dishes' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('dishes')}
            className="flex items-center gap-2"
          >
            <ChefHat className="h-4 w-4" />
            תצוגת מנות
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <KitchenSummaryStats
        orders={orders}
        stats={stats}
        fridayDate={effectiveDate}
      />

      {/* Critical Preferences Alert */}
      {orders.some(o => hasCriticalPreferences(o.customer.preferences)) && (
        <Card className="border-2 border-red-500 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              התראות קריטיות להיום
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orders
                .filter(o => hasCriticalPreferences(o.customer.preferences))
                .map(order => (
                  <div key={order.id} className="text-sm">
                    <span className="font-semibold">{order.orderNumber} - {order.customer.name}:</span>
                    <span className="text-red-600 mr-2">
                      {order.customer.preferences
                        ?.filter(p => p.type === 'ALLERGY' || p.type === 'MEDICAL')
                        .map(p => `${p.type === 'ALLERGY' ? '🚨 אלרגיה' : '⚕️ רפואי'}: ${p.value}`)
                        .join(' | ')}
                    </span>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="mr-3 text-muted-foreground">טוען הזמנות...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">שגיאה בטעינת ההזמנות</p>
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="h-4 w-4 ml-2" />
              נסה שוב
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!isLoading && !error && (
        viewMode === 'kanban' ? (
          <KanbanBoard
            groupedOrders={groupedOrders}
            preparationProgress={preparationProgress}
            onDishCheck={handleDishCheck}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <BatchCookingView
            dishes={dishes}
          />
        )
      )}
    </div>
  )
}
