// src/components/kitchen/kitchen-dashboard.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import { Check, Clock, Package, AlertTriangle, RefreshCw, Info, CheckSquare, Square, ClipboardList, ChefHat, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/lib/hooks/use-toast'
import { CriticalPreferenceAlert, PreferenceBadgeGroup } from '@/components/customers/preference-badge'
import { BatchCookingView } from '@/components/kitchen/batch-cooking-view'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import type { Order, OrderStatus, Customer, CustomerPreference, OrderItem, Dish } from '@/lib/types/database'

interface KitchenOrder extends Order {
  customer: Customer & {
    preferences?: CustomerPreference[]
  }
  orderItems: (OrderItem & {
    dish: Dish
  })[]
}

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
    status: (order.status?.toUpperCase() || 'NEW') as OrderStatus
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
        status: order.status.toUpperCase() // Ensure uppercase for display
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
      // Map the status to lowercase as expected by the API
      const statusMap: Record<string, string> = {
        'NEW': 'new',
        'CONFIRMED': 'confirmed',
        'PREPARING': 'preparing',
        'READY': 'ready',
        'DELIVERED': 'delivered',
        'CANCELLED': 'cancelled'
      }

      const mappedStatus = statusMap[newStatus] || newStatus.toLowerCase()

      console.log(`Updating order ${orderId} status to ${mappedStatus}`)

      const response = await fetchWithAuth(`/api/orders/${orderId}`, {
        method: 'PATCH',  // Changed from PUT to PATCH
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: mappedStatus })  // Send lowercase status
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

      // Get Hebrew status text for the toast
      const statusTextMap: Record<OrderStatus, string> = {
        'NEW': 'חדש',
        'CONFIRMED': 'מאושר',
        'PREPARING': 'בהכנה',
        'READY': 'מוכן',
        'DELIVERED': 'נמסר',
        'CANCELLED': 'בוטל'
      }

      toast({
        title: "הסטטוס עודכן",
        description: `סטטוס ההזמנה שונה ל-${statusTextMap[newStatus] || newStatus}`,
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

  // Check if all dishes are prepared for an order
  const areAllDishesPrepared = (order: KitchenOrder): boolean => {
    const orderProgress = preparationProgress[order.id] || {}
    return order.orderItems.every(item => orderProgress[item.id] === true)
  }

  // Filter orders based on view
  const filteredOrders = orders.filter(order => {
    if (view === 'all') return ['NEW', 'CONFIRMED', 'PREPARING', 'READY'].includes(order.status)
    if (view === 'preparing') return order.status === 'PREPARING'
    if (view === 'ready') return order.status === 'READY'
    return true
  })

  // Group orders by status
  const groupedOrders = {
    NEW: filteredOrders.filter(o => o.status === 'NEW'),
    CONFIRMED: filteredOrders.filter(o => o.status === 'CONFIRMED'),
    PREPARING: filteredOrders.filter(o => o.status === 'PREPARING'),
    READY: filteredOrders.filter(o => o.status === 'READY')
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'NEW': return 'bg-purple-500'
      case 'CONFIRMED': return 'bg-blue-500'
      case 'PREPARING': return 'bg-yellow-500'
      case 'READY': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
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

  const hasCriticalPreferences = (preferences?: CustomerPreference[]) => {
    return preferences?.some(p => p.type === 'ALLERGY' || p.type === 'MEDICAL') || false
  }

  const getPreferenceSummary = (preferences?: CustomerPreference[]) => {
    if (!preferences || preferences.length === 0) return null

    const critical = preferences.filter(p => p.type === 'ALLERGY' || p.type === 'MEDICAL')
    if (critical.length === 0) return null

    return critical.map(p => `${p.type === 'ALLERGY' ? '🚨 אלרגיה' : '⚕️ רפואי'}: ${p.value}`).join(' | ')
  }

  // Prepare data for dish view
  const dishAggregation = useMemo(() => {
    const dishMap = new Map<string, any>()

    // Include all active orders (not delivered or cancelled)
    const relevantOrders = orders.filter(order =>
      ['NEW', 'CONFIRMED', 'PREPARING', 'READY'].includes(order.status)
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">לוח מטבח</h1>
            {deliveryDate && (
              <div className="flex items-center gap-2 mt-2 text-lg text-muted-foreground">
                <Calendar className="h-5 w-5" />
                <span>הזמנות ליום {format(new Date(deliveryDate), 'EEEE, d בMMMM yyyy', { locale: he })}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-3 py-1">
              {filteredOrders.length} הזמנות פעילות
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border w-fit">
          <Button
            variant={viewMode === 'orders' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('orders')}
            className="flex items-center gap-2"
          >
            <ClipboardList className="h-4 w-4" />
            תצוגת הזמנות
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

      {/* Critical Preferences Summary */}
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
                      {getPreferenceSummary(order.customer.preferences)}
                    </span>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content based on view mode */}
      {viewMode === 'dishes' ? (
        // Dish View
        <BatchCookingView
          dishes={dishAggregation}
        />
      ) : (
        // Order View
        <>
          {/* View Tabs */}
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                כל ההזמנות ({orders.filter(o => ['NEW', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status)).length})
              </TabsTrigger>
              <TabsTrigger value="preparing">
                בהכנה ({orders.filter(o => o.status === 'PREPARING').length})
              </TabsTrigger>
              <TabsTrigger value="ready">
                מוכן ({orders.filter(o => o.status === 'READY').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={view} className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {['NEW', 'CONFIRMED', 'PREPARING', 'READY'].map(status => (
              <div key={status} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", getStatusColor(status as OrderStatus))} />
                  <h3 className="font-semibold">
                    {status === 'NEW' && 'הזמנות חדשות'}
                    {status === 'CONFIRMED' && 'ממתין להכנה'}
                    {status === 'PREPARING' && 'בהכנה'}
                    {status === 'READY' && 'מוכן למשלוח'}
                  </h3>
                  <Badge variant="outline">
                    {groupedOrders[status as keyof typeof groupedOrders].length}
                  </Badge>
                </div>

                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {groupedOrders[status as keyof typeof groupedOrders].map(order => (
                      <Card
                        key={order.id}
                        className={cn(
                          "cursor-pointer transition-all",
                          selectedOrderId === order.id && "ring-2 ring-primary",
                          hasCriticalPreferences(order.customer.preferences) && "border-2 border-red-400"
                        )}
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base">
                                הזמנה #{order.orderNumber}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {order.customer.name}
                              </p>
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
                            {order.status === 'PREPARING' ? (
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
                                          handleDishCheck(order.id, item.id, checked as boolean)
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
                              order.orderItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
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

                          {/* Time Info - Only show order time, not delivery */}
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 ml-1" />
                            <span>הוזמן ב-{format(new Date(order.createdAt), 'HH:mm')}</span>
                          </div>
                        </CardContent>

                        <CardFooter className="pt-3">
                          {getNextStatus(order.status) && (
                            <Button
                              className="w-full"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                const nextStatus = getNextStatus(order.status)
                                if (nextStatus) {
                                  // For PREPARING orders, only allow marking as READY if all dishes are checked
                                  if (order.status === 'PREPARING' && !areAllDishesPrepared(order)) {
                                    toast({
                                      title: "לא ניתן לסמן כמוכן",
                                      description: "יש לסמן את כל המנות כמוכנות לפני סימון ההזמנה כמוכנה",
                                      variant: "destructive",
                                    })
                                    return
                                  }
                                  handleStatusChange(order.id, nextStatus)
                                }
                              }}
                              disabled={order.status === 'PREPARING' && !areAllDishesPrepared(order)}
                            >
                              {order.status === 'PREPARING' && !areAllDishesPrepared(order) ? (
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
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      </>
      )}
    </div>
  )
}
