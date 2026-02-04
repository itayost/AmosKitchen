// src/components/kitchen/kitchen-dashboard.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/lib/hooks/use-toast'
import { BatchCookingView } from '@/components/kitchen/batch-cooking-view'
import { KitchenDashboardHeader } from '@/components/kitchen/kitchen-dashboard-header'
import { CriticalAlertsCard } from '@/components/kitchen/critical-alerts-card'
import { OrderStatusColumn } from '@/components/kitchen/order-status-column'
import { KitchenOrder } from '@/components/kitchen/kitchen-order-card'
import { normalizeStatus, statusToApi, STATUS_LABELS_HE } from '@/lib/utils/order-status'
import type { OrderStatus } from '@/lib/types/database'

// Re-export KitchenOrder type for external use
export type { KitchenOrder }

interface KitchenDashboardProps {
  initialOrders?: KitchenOrder[]
  deliveryDate?: Date | null
}

// Track completed dishes for preparing orders (UI state only)
interface PreparationProgress {
  [orderId: string]: {
    [itemId: string]: boolean
  }
}

export function KitchenDashboard({ initialOrders = [], deliveryDate }: KitchenDashboardProps) {
  // Normalize initial orders to ensure uppercase status
  const normalizedInitialOrders = initialOrders.map(order => ({
    ...order,
    status: normalizeStatus(order.status)
  }))

  const [orders, setOrders] = useState<KitchenOrder[]>(normalizedInitialOrders)
  const [view, setView] = useState<'all' | 'preparing' | 'ready'>('all')
  const [viewMode, setViewMode] = useState<'orders' | 'dishes'>('orders')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [preparationProgress, setPreparationProgress] = useState<PreparationProgress>({})
  const { toast } = useToast()

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const response = await fetchWithAuth('/api/orders/next-delivery')
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch orders')
      }
      const data = await response.json()

      // Ensure status format consistency
      const normalizedOrders = data.orders.map((order: any) => ({
        ...order,
        status: normalizeStatus(order.status)
      }))

      setOrders(normalizedOrders)
      toast({
        title: "רוענן",
        description: "ההזמנות עודכנו בהצלחה",
      })
    } catch (error) {
      console.error('Refresh error:', error)
      toast({
        title: "שגיאה",
        description: error instanceof Error ? error.message : "נכשל רענון ההזמנות",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [toast])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // Use centralized status conversion
      const mappedStatus = statusToApi(newStatus)

      console.log(`Updating order ${orderId} status to ${mappedStatus}`)

      const response = await fetchWithAuth(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: mappedStatus })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.error('API error response:', errorData)
        throw new Error(errorData.message || `Server error: ${response.status}`)
      }

      const responseData = await response.json()
      console.log('Status update response:', responseData)

      // Update local state
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ))

      // Clear preparation progress when moving to READY
      if (newStatus === 'READY') {
        setPreparationProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[orderId]
          return newProgress
        })
      }

      toast({
        title: "הסטטוס עודכן",
        description: `סטטוס ההזמנה שונה ל-${STATUS_LABELS_HE[newStatus] || newStatus}`,
      })
    } catch (error) {
      console.error('Status update error:', error)
      toast({
        title: "שגיאה",
        description: error instanceof Error ? error.message : "נכשל עדכון סטטוס ההזמנה",
        variant: "destructive",
      })
    }
  }

  // Handle dish preparation checkbox
  const handleDishCheck = (orderId: string, itemId: string, checked: boolean) => {
    setPreparationProgress(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [itemId]: checked
      }
    }))
  }

  // Filter orders based on view
  const filteredOrders = orders.filter(order => {
    if (view === 'all') return ['PREPARING', 'READY'].includes(order.status)
    if (view === 'preparing') return order.status === 'PREPARING'
    if (view === 'ready') return order.status === 'READY'
    return true
  })

  // Group orders by status
  const groupedOrders = {
    PREPARING: filteredOrders.filter(o => o.status === 'PREPARING'),
    READY: filteredOrders.filter(o => o.status === 'READY')
  }

  // Show toast when preparation is incomplete
  const handlePreparationIncomplete = () => {
    toast({
      title: "לא ניתן לסמן כמוכן",
      description: "יש לסמן את כל המנות כמוכנות לפני סימון ההזמנה כמוכנה",
      variant: "destructive",
    })
  }

  // Prepare data for dish view
  const dishAggregation = useMemo(() => {
    const dishMap = new Map<string, any>()

    // Include all active orders (not delivered or cancelled)
    const relevantOrders = orders.filter(order =>
      ['PREPARING', 'READY'].includes(order.status)
    )

    relevantOrders.forEach(order => {
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

        const dish = dishMap.get(dishId)
        dish.totalQuantity += item.quantity
        dish.orderCount += 1
        dish.orders.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customer.name,
          quantity: item.quantity,
          notes: item.notes || order.notes
        })
      })
    })

    return Array.from(dishMap.values())
  }, [orders])

  return (
    <div className="space-y-6">
      {/* Header */}
      <KitchenDashboardHeader
        deliveryDate={deliveryDate}
        orderCount={filteredOrders.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* Critical Preferences Summary */}
      <CriticalAlertsCard orders={orders} />

      {/* Content based on view mode */}
      {viewMode === 'dishes' ? (
        <BatchCookingView dishes={dishAggregation} />
      ) : (
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              כל ההזמנות ({orders.filter(o => ['PREPARING', 'READY'].includes(o.status)).length})
            </TabsTrigger>
            <TabsTrigger value="preparing">
              בהכנה ({orders.filter(o => o.status === 'PREPARING').length})
            </TabsTrigger>
            <TabsTrigger value="ready">
              מוכן ({orders.filter(o => o.status === 'READY').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={view} className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {(['PREPARING', 'READY'] as const).map(status => (
                <OrderStatusColumn
                  key={status}
                  status={status}
                  orders={groupedOrders[status]}
                  selectedOrderId={selectedOrderId}
                  onSelectOrder={setSelectedOrderId}
                  preparationProgress={preparationProgress}
                  onDishCheck={handleDishCheck}
                  onStatusChange={handleStatusChange}
                  onPreparationIncomplete={handlePreparationIncomplete}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
