// src/components/kitchen/kitchen-dashboard.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, Clock, Package, AlertTriangle, RefreshCw, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/lib/hooks/use-toast'
import { CriticalPreferenceAlert, PreferenceBadgeGroup } from '@/components/customers/preference-badge'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
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
}

export function KitchenDashboard({ initialOrders = [] }: KitchenDashboardProps) {
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders)
  const [view, setView] = useState<'all' | 'preparing' | 'ready'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
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
      const response = await fetch('/api/orders/today')
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      const data = await response.json()
      setOrders(data)
      toast({
        title: "רוענן",
        description: "ההזמנות עודכנו בהצלחה",
      })
    } catch (error) {
      console.error('Refresh error:', error)
      toast({
        title: "שגיאה",
        description: "נכשל רענון ההזמנות",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [toast])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ))

      toast({
        title: "הסטטוס עודכן",
        description: `סטטוס ההזמנה שונה בהצלחה`,
      })
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "נכשל עדכון סטטוס ההזמנה",
        variant: "destructive",
      })
    }
  }

  // Filter orders based on view
  const filteredOrders = orders.filter(order => {
    if (view === 'all') return ['CONFIRMED', 'PREPARING', 'READY'].includes(order.status)
    if (view === 'preparing') return order.status === 'PREPARING'
    if (view === 'ready') return order.status === 'READY'
    return true
  })

  // Group orders by status
  const groupedOrders = {
    CONFIRMED: filteredOrders.filter(o => o.status === 'CONFIRMED'),
    PREPARING: filteredOrders.filter(o => o.status === 'PREPARING'),
    READY: filteredOrders.filter(o => o.status === 'READY')
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-blue-500'
      case 'PREPARING': return 'bg-yellow-500'
      case 'READY': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case 'CONFIRMED': return 'PREPARING'
      case 'PREPARING': return 'READY'
      case 'READY': return 'DELIVERED'
      default: return null
    }
  }

  const getStatusActionLabel = (status: OrderStatus) => {
    switch (status) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">לוח מטבח</h1>
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

      {/* View Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            כל ההזמנות ({orders.filter(o => ['CONFIRMED', 'PREPARING', 'READY'].includes(o.status)).length})
          </TabsTrigger>
          <TabsTrigger value="preparing">
            בהכנה ({orders.filter(o => o.status === 'PREPARING').length})
          </TabsTrigger>
          <TabsTrigger value="ready">
            מוכן ({orders.filter(o => o.status === 'READY').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={view} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {['CONFIRMED', 'PREPARING', 'READY'].map(status => (
              <div key={status} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", getStatusColor(status as OrderStatus))} />
                  <h3 className="font-semibold">
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

                          {/* Order Items */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">פריטים:</h4>
                            {order.orderItems.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="font-medium">{item.dish.name}</span>
                                <Badge variant="secondary" className="h-6">
                                  x{item.quantity}
                                </Badge>
                              </div>
                            ))}
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
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              <Clock className="h-3 w-3 inline ml-1" />
                              {format(new Date(order.createdAt), 'HH:mm')}
                            </span>
                            <span>
                              משלוח: {format(new Date(order.deliveryDate), 'dd/MM')}
                            </span>
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
                                  handleStatusChange(order.id, nextStatus)
                                }
                              }}
                            >
                              {getStatusActionLabel(order.status)}
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
    </div>
  )
}
