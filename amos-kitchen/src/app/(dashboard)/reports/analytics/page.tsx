// src/app/(dashboard)/reports/analytics/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { format, subMonths } from 'date-fns'
import { he } from 'date-fns/locale'
import {
    TrendingUp,
    TrendingDown,
    Users,
    ShoppingCart,
    DollarSign,
    Package,
    Calendar,
    BarChart3,
    PieChart,
    Download,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useToast } from '@/lib/hooks/use-toast'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import Link from 'next/link'

interface AnalyticsData {
    summary: {
        totalRevenue: number
        totalOrders: number
        averageOrderValue: number
        totalCustomers: number
        newCustomers: number
        returningCustomers: number
        revenueGrowth: number
        ordersGrowth: number
    }
    topDishes: Array<{
        name: string
        quantity: number
        revenue: number
        orderCount: number
    }>
    topCustomers: Array<{
        name: string
        totalSpent: number
        orderCount: number
        lastOrder: string
    }>
    orderTrends: {
        daily: Array<{ date: string; orders: number; revenue: number }>
        byDay: Array<{ day: string; avgOrders: number }>
    }
}

export default function AnalyticsPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [period, setPeriod] = useState('month')
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        fetchAnalytics()
    }, [period])

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            const response = await fetchWithAuth(`/api/reports/analytics?period=${period}`)

            if (!response.ok) {
                // If analytics endpoint doesn't exist, fetch from dashboard for now
                const dashboardResponse = await fetchWithAuth('/api/dashboard')
                if (dashboardResponse.ok) {
                    const dashboardData = await dashboardResponse.json()

                    // Transform dashboard data to analytics format
                    const analyticsData: AnalyticsData = {
                        summary: {
                            totalRevenue: dashboardData.week?.revenue || 0,
                            totalOrders: dashboardData.week?.orders || 0,
                            averageOrderValue: dashboardData.week?.revenue && dashboardData.week?.orders
                                ? dashboardData.week.revenue / dashboardData.week.orders
                                : 0,
                            totalCustomers: dashboardData.customers?.total || 0,
                            newCustomers: dashboardData.today?.newCustomers || 0,
                            returningCustomers: dashboardData.customers?.active || 0,
                            revenueGrowth: parseFloat(dashboardData.comparison?.revenueChangePercent || 0),
                            ordersGrowth: parseFloat(dashboardData.comparison?.ordersChangePercent || 0)
                        },
                        topDishes: dashboardData.topDishes || [],
                        topCustomers: [],
                        orderTrends: {
                            daily: dashboardData.chartData?.map((d: any) => ({
                                date: d.date,
                                orders: d.orders,
                                revenue: d.revenue
                            })) || [],
                            byDay: []
                        }
                    }
                    setData(analyticsData)
                }
            } else {
                const analyticsData = await response.json()
                setData(analyticsData)
            }
        } catch (error) {
            console.error('Error fetching analytics:', error)
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לטעון את הנתונים',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const exportReport = async () => {
        try {
            setExporting(true)
            const response = await fetchWithAuth(`/api/reports/analytics/export?period=${period}`)

            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `analytics-${period}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)

                toast({
                    title: 'הצלחה',
                    description: 'הדוח יוצא בהצלחה'
                })
            }
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לייצא את הדוח',
                variant: 'destructive'
            })
        } finally {
            setExporting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <LoadingSpinner />
            </div>
        )
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">לא נמצאו נתונים לתקופה המבוקשת</p>
            </div>
        )
    }

    const StatCard = ({ title, value, change, icon: Icon, prefix = '' }: any) => (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardDescription>{title}</CardDescription>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(change)}%
                    </div>
                )}
            </CardContent>
        </Card>
    )

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/dashboard" className="hover:text-foreground">
                    לוח בקרה
                </Link>
                <ChevronRight className="h-4 w-4" />
                <Link href="/reports" className="hover:text-foreground">
                    דוחות
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">ניתוח לקוחות</span>
            </div>

            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">ניתוח לקוחות וביצועים</h1>
                    <p className="text-muted-foreground">
                        ניתוח מעמיק של נתוני הלקוחות והמכירות
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">שבוע אחרון</SelectItem>
                            <SelectItem value="month">חודש אחרון</SelectItem>
                            <SelectItem value="quarter">רבעון אחרון</SelectItem>
                            <SelectItem value="year">שנה אחרונה</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={exportReport} disabled={exporting}>
                        <Download className="h-4 w-4 ml-2" />
                        {exporting ? 'מייצא...' : 'ייצוא'}
                    </Button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard
                    title="סך הכנסות"
                    value={data.summary.totalRevenue}
                    change={data.summary.revenueGrowth}
                    icon={DollarSign}
                    prefix="₪"
                />
                <StatCard
                    title="סך הזמנות"
                    value={data.summary.totalOrders}
                    change={data.summary.ordersGrowth}
                    icon={ShoppingCart}
                />
                <StatCard
                    title="ממוצע הזמנה"
                    value={data.summary.averageOrderValue.toFixed(0)}
                    icon={TrendingUp}
                    prefix="₪"
                />
                <StatCard
                    title="לקוחות פעילים"
                    value={data.summary.returningCustomers}
                    icon={Users}
                />
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="customers" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="customers">לקוחות מובילים</TabsTrigger>
                    <TabsTrigger value="dishes">מנות פופולריות</TabsTrigger>
                    <TabsTrigger value="trends">מגמות</TabsTrigger>
                </TabsList>

                {/* Top Customers */}
                <TabsContent value="customers">
                    <Card>
                        <CardHeader>
                            <CardTitle>לקוחות מובילים</CardTitle>
                            <CardDescription>
                                הלקוחות עם ההוצאה הגבוהה ביותר בתקופה
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {data.topCustomers.length > 0 ? (
                                <div className="space-y-4">
                                    {data.topCustomers.map((customer, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <p className="font-medium">{customer.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {customer.orderCount} הזמנות
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">₪{customer.totalSpent.toLocaleString()}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    הזמנה אחרונה: {customer.lastOrder}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    אין נתוני לקוחות לתקופה זו
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Top Dishes */}
                <TabsContent value="dishes">
                    <Card>
                        <CardHeader>
                            <CardTitle>מנות פופולריות</CardTitle>
                            <CardDescription>
                                המנות הנמכרות ביותר בתקופה
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.topDishes.map((dish, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{dish.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {dish.orderCount} הזמנות
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{dish.quantity} יחידות</p>
                                            <p className="text-sm text-muted-foreground">
                                                ₪{dish.revenue.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Trends */}
                <TabsContent value="trends">
                    <div className="grid gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>מגמות הזמנות</CardTitle>
                                <CardDescription>
                                    כמות הזמנות והכנסות לאורך זמן
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data.orderTrends.daily.map((day, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                                            <span className="text-sm">
                                                {format(new Date(day.date), 'dd/MM', { locale: he })}
                                            </span>
                                            <div className="flex gap-4">
                                                <span className="text-sm">
                                                    {day.orders} הזמנות
                                                </span>
                                                <span className="text-sm font-medium">
                                                    ₪{day.revenue.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>סיכום תקופתי</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span>לקוחות חדשים</span>
                                    <span className="font-bold">{data.summary.newCustomers}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>לקוחות חוזרים</span>
                                    <span className="font-bold">{data.summary.returningCustomers}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>סך לקוחות</span>
                                    <span className="font-bold">{data.summary.totalCustomers}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}