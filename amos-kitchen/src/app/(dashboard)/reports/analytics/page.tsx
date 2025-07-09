// src/app/(dashboard)/reports/analytics/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns'
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
    Download
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

// Import chart components if they exist, otherwise we'll create simple placeholders
// import { RevenueChart } from '@/components/reports/revenue-chart'
// import { OrdersChart } from '@/components/reports/orders-chart'
// import { CategoryBreakdown } from '@/components/reports/category-breakdown'
// import { CustomerAnalytics } from '@/components/reports/customer-analytics'

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
    revenue: {
        daily: Array<{ date: string; amount: number }>
        weekly: Array<{ week: string; amount: number }>
        monthly: Array<{ month: string; amount: number }>
    }
    orders: {
        byStatus: Record<string, number>
        byDay: Array<{ day: string; count: number }>
        byHour: Array<{ hour: number; count: number }>
    }
    dishes: {
        topSelling: Array<{ name: string; quantity: number; revenue: number }>
        byCategory: Record<string, { quantity: number; revenue: number }>
    }
    customers: {
        byOrderCount: Array<{ range: string; count: number }>
        topSpenders: Array<{ name: string; totalSpent: number; orderCount: number }>
    }
}

export default function AnalyticsPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [period, setPeriod] = useState('month') // month, quarter, year
    const [compareMode, setCompareMode] = useState(false)

    useEffect(() => {
        fetchAnalytics()
    }, [period])

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/reports/analytics?period=${period}`)
            if (!response.ok) throw new Error('Failed to fetch analytics')

            const analyticsData = await response.json()
            setData(analyticsData)
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
            const response = await fetch(`/api/reports/analytics/export?period=${period}`)
            if (!response.ok) throw new Error('Export failed')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `analytics-${period}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
            a.click()
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: 'הייצוא נכשל',
                variant: 'destructive'
            })
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <LoadingSpinner />
            </div>
        )
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">אין נתונים להצגה</p>
            </div>
        )
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS'
        }).format(amount)
    }

    const formatPercent = (value: number) => {
        const formatted = new Intl.NumberFormat('he-IL', {
            style: 'percent',
            minimumFractionDigits: 1
        }).format(value / 100)

        if (value > 0) return `+${formatted}`
        return formatted
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">ניתוח נתונים</h1>
                    <p className="text-muted-foreground">
                        תובנות מעמיקות על הביצועים העסקיים
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="month">חודש אחרון</SelectItem>
                            <SelectItem value="quarter">רבעון</SelectItem>
                            <SelectItem value="year">שנה</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={exportReport}>
                        <Download className="ml-2 h-4 w-4" />
                        ייצוא לאקסל
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            סה״כ הכנסות
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.summary.revenueGrowth > 0 ? (
                                <span className="text-green-600 flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    {formatPercent(data.summary.revenueGrowth)}
                                </span>
                            ) : (
                                <span className="text-red-600 flex items-center gap-1">
                                    <TrendingDown className="h-3 w-3" />
                                    {formatPercent(data.summary.revenueGrowth)}
                                </span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            מספר הזמנות
                        </CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.summary.totalOrders}</div>
                        <p className="text-xs text-muted-foreground">
                            ממוצע: {formatCurrency(data.summary.averageOrderValue)}
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
                        <div className="text-2xl font-bold">{data.summary.totalCustomers}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.summary.newCustomers} חדשים
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            לקוחות חוזרים
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.summary.returningCustomers}</div>
                        <p className="text-xs text-muted-foreground">
                            {((data.summary.returningCustomers / data.summary.totalCustomers) * 100).toFixed(1)}% מהלקוחות
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Tabs */}
            <Tabs defaultValue="revenue" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="revenue">הכנסות</TabsTrigger>
                    <TabsTrigger value="orders">הזמנות</TabsTrigger>
                    <TabsTrigger value="dishes">מנות</TabsTrigger>
                    <TabsTrigger value="customers">לקוחות</TabsTrigger>
                </TabsList>

                <TabsContent value="revenue" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>מגמת הכנסות</CardTitle>
                            <CardDescription>
                                הכנסות לפי תקופה
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Revenue chart would go here */}
                            <div className="h-80 flex items-center justify-center text-muted-foreground">
                                גרף הכנסות
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="orders" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>ניתוח הזמנות</CardTitle>
                            <CardDescription>
                                התפלגות הזמנות לפי סטטוס וזמן
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Orders analysis would go here */}
                            <div className="h-80 flex items-center justify-center text-muted-foreground">
                                ניתוח הזמנות
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="dishes" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>מנות פופולריות</CardTitle>
                            <CardDescription>
                                המנות הנמכרות ביותר
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Dishes analysis would go here */}
                            <div className="h-80 flex items-center justify-center text-muted-foreground">
                                ניתוח מנות
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="customers" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>ניתוח לקוחות</CardTitle>
                            <CardDescription>
                                התנהגות ודפוסי רכישה
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Customer analytics would go here */}
                            <div className="h-80 flex items-center justify-center text-muted-foreground">
                                ניתוח לקוחות
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
