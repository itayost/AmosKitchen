// src/components/dashboard/dashboard-content.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import { format, isSameDay, addDays } from 'date-fns'
import { he } from 'date-fns/locale'
import {
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Users,
  DollarSign,
  AlertTriangle,
  Calendar,
  Activity,
  Clock,
  TrendingDown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { TopDishes } from '@/components/dashboard/top-dishes'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { NeedsAttentionSection, type NeedsAttentionAlert } from '@/components/dashboard/needs-attention-section'
import { FridaySummaryCard } from '@/components/dashboard/friday-summary-card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useToast } from '@/lib/hooks/use-toast'
import { getNextFriday, getFridayStatus } from '@/lib/constants/friday'

interface DashboardData {
  today: {
    orders: number
    revenue: number
    newCustomers: number
  }
  week: {
    orders: number
    revenue: number
    pendingOrders: number
    completedOrders: number
    fulfillmentRate?: number
  }
  friday: {
    orders: number
    revenue: number
    dishes: number
  }
  recentOrders: any[]
  recentActivity: any[]
  topDishes: any[]
  customers: {
    total: number
    active: number
  }
  chartData: any[]
  comparison: {
    revenueChange: number
    revenueChangePercent: number
    ordersChange: number
    ordersChangePercent: number
  }
}

// Compute alerts from dashboard data
function computeAlerts(data: DashboardData): NeedsAttentionAlert[] {
  const alerts: NeedsAttentionAlert[] = []
  const today = new Date()
  const tomorrow = addDays(today, 1)

  // 1. Approaching delivery (today/tomorrow) not READY
  const approachingOrders = data.recentOrders.filter((o) => {
    const deliveryDate = new Date(o.deliveryDate)
    const isApproaching = isSameDay(deliveryDate, today) || isSameDay(deliveryDate, tomorrow)
    const notReady = !['READY', 'DELIVERED'].includes(o.status)
    return isApproaching && notReady
  })
  if (approachingOrders.length > 0) {
    alerts.push({
      id: 'approaching_delivery',
      type: 'approaching_delivery',
      priority: 'high',
      title: 'הזמנות קרובות למסירה',
      description: `${approachingOrders.length} הזמנות למסירה היום/מחר שעדיין לא מוכנות`,
      count: approachingOrders.length,
      actionLabel: 'עבור למטבח',
      actionHref: '/kitchen',
      icon: Clock,
    })
  }

  // 3. Low fulfillment rate (< 90%)
  const fulfillmentRate = data.week.fulfillmentRate ??
    (data.week.completedOrders / (data.week.pendingOrders + data.week.completedOrders) * 100)

  if (fulfillmentRate < 90 && data.week.pendingOrders + data.week.completedOrders > 0) {
    alerts.push({
      id: 'low_fulfillment',
      type: 'low_fulfillment',
      priority: 'medium',
      title: 'שיעור השלמה נמוך',
      description: `${fulfillmentRate.toFixed(1)}% - מתחת ל-90%`,
      count: 0,
      actionLabel: 'צפה בדוחות',
      actionHref: '/reports',
      icon: TrendingDown,
    })
  }

  // Sort by priority
  const priorityOrder = { high: 1, medium: 2, low: 3 }
  return alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

// Compute Friday preparation progress
function computeFridayProgress(orders: any[]) {
  const fridayDate = getNextFriday()
  const fridayOrders = orders.filter((o) => {
    const deliveryDate = new Date(o.deliveryDate)
    return isSameDay(deliveryDate, fridayDate)
  })

  return {
    pending: 0,
    preparing: fridayOrders.filter((o) => o.status === 'PREPARING').length,
    ready: fridayOrders.filter((o) => o.status === 'READY').length,
    delivered: fridayOrders.filter((o) => o.status === 'DELIVERED').length,
  }
}

export function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetchWithAuth('/api/dashboard')
      if (!response.ok) throw new Error('Failed to fetch dashboard data')

      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את נתוני הדשבורד',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Compute alerts from data
  const alerts = useMemo(() => {
    if (!data) return []
    return computeAlerts(data)
  }, [data])

  // Compute Friday progress
  const fridayProgress = useMemo(() => {
    if (!data) return undefined
    return computeFridayProgress(data.recentOrders)
  }, [data])

  if (loading || !data) {
    return <LoadingSpinner centered />
  }

  const fridayDate = getNextFriday()

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">דשבורד</h2>
          <p className="text-muted-foreground">
            {format(new Date(), 'EEEE, dd בMMMM yyyy', { locale: he })}
          </p>
        </div>
        <QuickActions />
      </div>

      {/* Needs Attention Section */}
      <NeedsAttentionSection alerts={alerts} />

      {/* Friday Summary */}
      <FridaySummaryCard
        fridayData={{
          date: fridayDate,
          orderCount: data.friday.orders,
          dishCount: data.friday.dishes,
          revenue: data.friday.revenue,
          status: getFridayStatus(),
        }}
        preparationProgress={fridayProgress}
      />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              הזמנות השבוע
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.week.orders}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {data.comparison.ordersChange > 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">
                    {data.comparison.ordersChangePercent}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">
                    {Math.abs(Number(data.comparison.ordersChangePercent))}%
                  </span>
                </>
              )}
              <span>מהשבוע שעבר</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              הכנסות השבוע
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₪{data.week.revenue.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {data.comparison.revenueChange > 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">
                    {data.comparison.revenueChangePercent}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">
                    {Math.abs(Number(data.comparison.revenueChangePercent))}%
                  </span>
                </>
              )}
              <span>מהשבוע שעבר</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              לקוחות פעילים
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.customers.active}</div>
            <p className="text-xs text-muted-foreground">
              מתוך {data.customers.total} לקוחות
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              הזמנות ליום שישי
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.friday.orders}</div>
            <p className="text-xs text-muted-foreground">
              {data.friday.dishes} מנות • ₪{data.friday.revenue.toFixed(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            סיכום יומי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{data.today.orders}</div>
              <p className="text-sm text-muted-foreground">הזמנות חדשות</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">₪{data.today.revenue.toFixed(0)}</div>
              <p className="text-sm text-muted-foreground">הכנסות</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data.today.newCustomers}</div>
              <p className="text-sm text-muted-foreground">לקוחות חדשים</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart & Top Dishes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>הכנסות השבוע</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart data={data.chartData} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>מנות פופולריות</CardTitle>
          </CardHeader>
          <CardContent>
            <TopDishes dishes={data.topDishes} />
          </CardContent>
        </Card>
      </div>

      {/* Order Status */}
      <DashboardStats weekStats={data.week} />

      {/* Recent Orders */}
      <RecentOrders orders={data.recentOrders} />

      {/* Recent Activity */}
      <RecentActivity activities={data.recentActivity} />
    </div>
  )
}
