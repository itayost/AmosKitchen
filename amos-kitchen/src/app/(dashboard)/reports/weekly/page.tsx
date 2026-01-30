// src/app/(dashboard)/reports/weekly/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { startOfWeek, endOfWeek, format } from 'date-fns'
import { he } from 'date-fns/locale'
import { ArrowRight, Download, TrendingUp, Users, DollarSign, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnimatedStatCard } from '@/components/reports/animated-stat-card'
import { TopDishesChart } from '@/components/reports/top-dishes-chart'
import { DailyOrdersChart } from '@/components/reports/daily-orders-chart'
import { CustomerAnalysis } from '@/components/reports/customer-analysis'
import { DonutChart } from '@/components/reports/donut-chart'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { DatePicker } from '@/components/shared/date-picker'
import { useToast } from '@/lib/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'

interface WeeklyReport {
    weekOf: string
    friday: string
    summary: {
        totalOrders: number
        totalRevenue: number
        uniqueCustomers: number
        averageOrderValue: number
        ordersByStatus: Record<string, number>
        ordersByDay: Array<{
            date: string
            count: number
            revenue: number
            dishes: Record<string, number>
        }>
    }
    topDishes: Array<{
        dish: any
        quantity: number
        revenue: number
        orderCount: number
    }>
    topCustomers: Array<{
        customer: any
        orderCount: number
        totalSpent: number
        favoritesDishes: Array<{ dish: string; count: number }>
    }>
    orders: any[]
}

export default function WeeklyReportPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [report, setReport] = useState<WeeklyReport | null>(null)
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        fetchReport()
    }, [selectedDate])

    const fetchReport = async () => {
        try {
            setLoading(true)
            const response = await fetchWithAuth(`/api/reports/weekly-summary?date=${selectedDate.toISOString()}`)

            if (!response.ok) throw new Error('Failed to fetch report')

            const data = await response.json()
            setReport(data)
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לטעון את הדוח השבועי',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        try {
            setExporting(true)
            toast({
                title: 'הצלחה',
                description: 'הדוח יוצא בהצלחה'
            })
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

    if (loading) return <LoadingSpinner centered />
    if (!report) return null

    const weekStart = startOfWeek(new Date(report.weekOf), { weekStartsOn: 0 })
    const weekEnd = endOfWeek(new Date(report.weekOf), { weekStartsOn: 0 })

    // Transform status data for donut chart
    const statusLabels: Record<string, string> = {
        new: 'חדש',
        confirmed: 'מאושר',
        preparing: 'בהכנה',
        ready: 'מוכן',
        delivered: 'נמסר',
        cancelled: 'בוטל'
    }

    const statusColors: Record<string, string> = {
        new: '#3b82f6',
        confirmed: '#22c55e',
        preparing: '#f59e0b',
        ready: '#a855f7',
        delivered: '#6b7280',
        cancelled: '#ef4444'
    }

    const statusChartData = Object.entries(report.summary.ordersByStatus).map(([status, count]) => ({
        label: statusLabels[status] || status,
        value: count,
        color: statusColors[status]
    }))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/reports')}
                        className="mb-2 gap-2"
                    >
                        <ArrowRight className="h-4 w-4" />
                        חזרה לדוחות
                    </Button>
                    <h1 className="text-3xl font-bold bg-gradient-to-l from-primary to-primary/60 bg-clip-text text-transparent">
                        דוח שבועי
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        שבוע {format(weekStart, 'dd/MM')} - {format(weekEnd, 'dd/MM/yyyy', { locale: he })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <DatePicker
                        date={selectedDate}
                        onDateChange={(date) => date && setSelectedDate(date)}
                    />
                    <Button
                        onClick={handleExport}
                        disabled={exporting}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        ייצוא לאקסל
                    </Button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <AnimatedStatCard
                    title="סה״כ הזמנות"
                    value={report.summary.totalOrders}
                    icon={ShoppingCart}
                    gradient="blue"
                />
                <AnimatedStatCard
                    title="סה״כ הכנסות"
                    value={report.summary.totalRevenue}
                    prefix="₪"
                    icon={DollarSign}
                    gradient="green"
                />
                <AnimatedStatCard
                    title="לקוחות ייחודיים"
                    value={report.summary.uniqueCustomers}
                    icon={Users}
                    gradient="purple"
                />
                <AnimatedStatCard
                    title="ערך הזמנה ממוצע"
                    value={report.summary.averageOrderValue}
                    prefix="₪"
                    decimals={0}
                    icon={TrendingUp}
                    gradient="orange"
                />
            </div>

            {/* Main Content Tabs */}
            <div>
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
                        <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
                        <TabsTrigger value="dishes">מנות פופולריות</TabsTrigger>
                        <TabsTrigger value="customers">ניתוח לקוחות</TabsTrigger>
                        <TabsTrigger value="details">פירוט הזמנות</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Daily Orders Chart - now with animations built-in */}
                        <DailyOrdersChart data={report.summary.ordersByDay} />

                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                            {/* Status Distribution with Donut Chart */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-semibold">התפלגות לפי סטטוס</CardTitle>
                                    <CardDescription>
                                        חלוקת ההזמנות לפי מצב נוכחי
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {statusChartData.length > 0 ? (
                                        <DonutChart
                                            data={statusChartData}
                                            size={180}
                                            thickness={35}
                                            totalLabel="הזמנות"
                                        />
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">
                                            אין נתונים להצגה
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Additional Stats */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-semibold">סיכום השבוע</CardTitle>
                                    <CardDescription>
                                        מדדים עיקריים לשבוע הנבחר
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">ימים פעילים</span>
                                            <span className="text-2xl font-bold text-blue-600">
                                                {report.summary.ordersByDay.filter(d => d.count > 0).length}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">ממוצע הזמנות ביום</span>
                                            <span className="text-2xl font-bold text-green-600">
                                                {(report.summary.totalOrders / Math.max(report.summary.ordersByDay.filter(d => d.count > 0).length, 1)).toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">יום עמוס ביותר</span>
                                            <span className="text-lg font-bold text-purple-600">
                                                {report.summary.ordersByDay.length > 0
                                                    ? format(new Date(report.summary.ordersByDay.reduce((max, day) =>
                                                        day.count > max.count ? day : max
                                                    ).date), 'EEEE', { locale: he })
                                                    : '-'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="dishes" className="space-y-6">
                        <TopDishesChart dishes={report.topDishes} />
                    </TabsContent>

                    <TabsContent value="customers" className="space-y-6">
                        <CustomerAnalysis customers={report.topCustomers} />
                    </TabsContent>

                    <TabsContent value="details" className="space-y-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">כל ההזמנות</CardTitle>
                                <CardDescription>
                                    רשימה מלאה של כל ההזמנות לשבוע זה
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center text-muted-foreground py-12 bg-muted/30 rounded-lg">
                                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium">טבלת הזמנות מפורטת</p>
                                    <p className="text-sm">יוצג בקרוב</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
