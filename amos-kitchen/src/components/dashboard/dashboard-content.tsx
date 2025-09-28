// src/components/dashboard/dashboard-content.tsx
'use client'

import { useState, useEffect } from 'react'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import {
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Calendar,
  Plus,
  FileText,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { TopDishes } from '@/components/dashboard/top-dishes'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { useToast } from '@/lib/hooks/use-toast'
import Link from 'next/link'

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

  if (loading || !data) {
    return <div>טוען...</div>
  }

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

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
          <TabsTrigger value="orders">הזמנות אחרונות</TabsTrigger>
          <TabsTrigger value="activity">פעילות אחרונה</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>הכנסות השבוע</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <RevenueChart data={data.chartData} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
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
        </TabsContent>

        <TabsContent value="orders">
          <RecentOrders orders={data.recentOrders} />
        </TabsContent>

        <TabsContent value="activity">
          <RecentActivity activities={data.recentActivity} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
