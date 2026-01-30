// src/app/(dashboard)/reports/analytics/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import {
    TrendingUp,
    Users,
    ShoppingCart,
    DollarSign,
    Download,
    ChevronRight,
    Crown,
    Award,
    Medal
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
import { AnimatedStatCard } from '@/components/reports/animated-stat-card'
import { DonutChart } from '@/components/reports/donut-chart'
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
    dishes?: {
        topSelling: Array<{
            name: string
            quantity: number
            revenue: number
            category?: string
        }>
        byCategory: Record<string, { quantity: number; revenue: number }>
    }
    customers?: {
        byOrderCount: Array<{ range: string; count: number }>
        topSpenders: Array<{
            id: string
            name: string
            totalSpent: number
            orderCount: number
        }>
    }
    topDishes?: Array<{
        name: string
        quantity: number
        revenue: number
        orderCount?: number
    }>
    topCustomers?: Array<{
        name: string
        totalSpent: number
        orderCount: number
        lastOrder?: string
    }>
    orderTrends?: {
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

            if (response.ok) {
                const analyticsData = await response.json()
                const normalizedData: AnalyticsData = {
                    ...analyticsData,
                    topDishes: analyticsData.dishes?.topSelling || analyticsData.topDishes || [],
                    topCustomers: analyticsData.customers?.topSpenders || analyticsData.topCustomers || [],
                    orderTrends: analyticsData.orderTrends || {
                        daily: analyticsData.revenue?.daily?.map((d: any) => ({
                            date: d.date,
                            orders: 0,
                            revenue: d.amount
                        })) || [],
                        byDay: analyticsData.orders?.byDay || []
                    }
                }
                setData(normalizedData)
            } else {
                const dashboardResponse = await fetchWithAuth('/api/dashboard')
                if (dashboardResponse.ok) {
                    const dashboardData = await dashboardResponse.json()
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
        return <LoadingSpinner centered />
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">לא נמצאו נתונים לתקופה המבוקשת</p>
            </div>
        )
    }

    // Prepare category data for donut chart
    const categoryChartData = data.dishes?.byCategory
        ? Object.entries(data.dishes.byCategory).map(([category, stats]) => {
            const categoryNames: Record<string, string> = {
                'appetizer': 'מנות ראשונות',
                'main': 'מנות עיקריות',
                'side': 'תוספות',
                'dessert': 'קינוחים',
                'beverage': 'משקאות',
                'APPETIZER': 'מנות ראשונות',
                'MAIN': 'מנות עיקריות',
                'SIDE': 'תוספות',
                'DESSERT': 'קינוחים',
                'BEVERAGE': 'משקאות'
            }
            return {
                label: categoryNames[category] || category,
                value: stats.revenue
            }
        })
        : []

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown className="h-5 w-5 text-yellow-500" />
            case 1: return <Award className="h-5 w-5 text-gray-400" />
            case 2: return <Medal className="h-5 w-5 text-amber-600" />
            default: return null
        }
    }

    const getRankBg = (index: number) => {
        switch (index) {
            case 0: return 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-200 dark:border-yellow-800'
            case 1: return 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 border-gray-200 dark:border-gray-700'
            case 2: return 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800'
            default: return ''
        }
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                    לוח בקרה
                </Link>
                <ChevronRight className="h-4 w-4" />
                <Link href="/reports" className="hover:text-foreground transition-colors">
                    דוחות
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground font-medium">ניתוח לקוחות</span>
            </div>

            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-l from-primary to-primary/60 bg-clip-text text-transparent">
                        ניתוח לקוחות וביצועים
                    </h1>
                    <p className="text-muted-foreground mt-1">
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
                    <Button onClick={exportReport} disabled={exporting} className="gap-2">
                        <Download className="h-4 w-4" />
                        {exporting ? 'מייצא...' : 'ייצוא'}
                    </Button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <AnimatedStatCard
                    title="סך הכנסות"
                    value={data.summary.totalRevenue}
                    prefix="₪"
                    change={data.summary.revenueGrowth}
                    changeLabel="מהתקופה הקודמת"
                    icon={DollarSign}
                    gradient="green"
                />
                <AnimatedStatCard
                    title="סך הזמנות"
                    value={data.summary.totalOrders}
                    change={data.summary.ordersGrowth}
                    changeLabel="מהתקופה הקודמת"
                    icon={ShoppingCart}
                    gradient="blue"
                />
                <AnimatedStatCard
                    title="ממוצע הזמנה"
                    value={Math.round(data.summary.averageOrderValue)}
                    prefix="₪"
                    icon={TrendingUp}
                    gradient="orange"
                />
                <AnimatedStatCard
                    title="לקוחות פעילים"
                    value={data.summary.returningCustomers}
                    icon={Users}
                    gradient="purple"
                />
            </div>

            {/* Main Content Tabs */}
            <div>
                <Tabs defaultValue="customers" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="customers">לקוחות מובילים</TabsTrigger>
                        <TabsTrigger value="dishes">מנות פופולריות</TabsTrigger>
                        <TabsTrigger value="categories">קטגוריות</TabsTrigger>
                        <TabsTrigger value="trends">מגמות</TabsTrigger>
                    </TabsList>

                    {/* Top Customers */}
                    <TabsContent value="customers">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">לקוחות מובילים</CardTitle>
                                <CardDescription>
                                    הלקוחות עם ההוצאה הגבוהה ביותר בתקופה
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {data.topCustomers && data.topCustomers.length > 0 ? (
                                    <div className="space-y-3">
                                        {data.topCustomers.slice(0, 10).map((customer, index) => (
                                            <div
                                                key={index}
                                                className={`flex items-center justify-between p-4 border rounded-xl transition-all hover:shadow-md ${getRankBg(index)}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${index < 3 ? 'bg-white dark:bg-gray-800 shadow-sm' : 'bg-primary/10'}`}>
                                                        {getRankIcon(index) || (
                                                            <span className="text-primary font-bold text-lg">{index + 1}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-lg">{customer.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {customer.orderCount} הזמנות
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-xl text-green-600 dark:text-green-400">
                                                        ₪{customer.totalSpent.toLocaleString()}
                                                    </p>
                                                    {customer.lastOrder && (
                                                        <p className="text-sm text-muted-foreground">
                                                            הזמנה אחרונה: {customer.lastOrder}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground py-12 bg-muted/30 rounded-lg">
                                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium">אין נתוני לקוחות</p>
                                        <p className="text-sm">לתקופה זו</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Top Dishes */}
                    <TabsContent value="dishes">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">מנות פופולריות</CardTitle>
                                <CardDescription>
                                    המנות הנמכרות ביותר בתקופה
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {(data.topDishes || []).map((dish, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center justify-between p-4 border rounded-xl transition-all hover:shadow-md ${getRankBg(index)}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${index < 3 ? 'bg-white dark:bg-gray-800 shadow-sm' : 'bg-primary/10'}`}>
                                                    {getRankIcon(index) || (
                                                        <span className="text-primary font-bold text-lg">{index + 1}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-lg">{dish.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {dish.orderCount || 0} הזמנות
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-xl">{dish.quantity} יחידות</p>
                                                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                                    ₪{dish.revenue.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Categories */}
                    <TabsContent value="categories">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-semibold">הכנסות לפי קטגוריה</CardTitle>
                                    <CardDescription>
                                        התפלגות ההכנסות לפי קטגוריות מנות
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {categoryChartData.length > 0 ? (
                                        <DonutChart
                                            data={categoryChartData}
                                            size={200}
                                            thickness={40}
                                            totalLabel="הכנסות"
                                            showTotal={false}
                                        />
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">
                                            אין נתוני קטגוריות זמינים
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {data.customers?.byOrderCount && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg font-semibold">תדירות הזמנה</CardTitle>
                                        <CardDescription>
                                            התפלגות לקוחות לפי מספר הזמנות
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {data.customers.byOrderCount.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                                >
                                                    <span className="font-medium">{item.range}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl font-bold text-primary">{item.count}</span>
                                                        <span className="text-sm text-muted-foreground">לקוחות</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Trends */}
                    <TabsContent value="trends">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-semibold">מגמות הזמנות</CardTitle>
                                    <CardDescription>
                                        כמות הזמנות והכנסות לאורך זמן
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {(data.orderTrends?.daily || []).map((day, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors"
                                            >
                                                <span className="text-sm font-medium">
                                                    {format(new Date(day.date), 'EEEE dd/MM', { locale: he })}
                                                </span>
                                                <div className="flex gap-6">
                                                    <span className="text-sm text-muted-foreground">
                                                        {day.orders} הזמנות
                                                    </span>
                                                    <span className="text-sm font-semibold text-green-600">
                                                        ₪{day.revenue.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-semibold">סיכום תקופתי</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">לקוחות חדשים</span>
                                            <span className="text-2xl font-bold text-blue-600">{data.summary.newCustomers}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">לקוחות חוזרים</span>
                                            <span className="text-2xl font-bold text-green-600">{data.summary.returningCustomers}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">סך לקוחות</span>
                                            <span className="text-2xl font-bold text-purple-600">{data.summary.totalCustomers}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
