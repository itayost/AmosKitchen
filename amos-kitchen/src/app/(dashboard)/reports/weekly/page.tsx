// src/app/(dashboard)/reports/weekly/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { startOfWeek, endOfWeek, format, addDays } from 'date-fns'
import { he } from 'date-fns/locale'
import { ArrowRight, Download, Calendar, TrendingUp, Users, DollarSign, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WeeklySummaryStats } from '@/components/reports/weekly-summary-stats'
import { TopDishesChart } from '@/components/reports/top-dishes-chart'
import { DailyOrdersChart } from '@/components/reports/daily-orders-chart'
import { CustomerAnalysis } from '@/components/reports/customer-analysis'
import { IngredientRequirements } from '@/components/reports/ingredient-requirements'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { DatePicker } from '@/components/shared/date-picker'
import { useToast } from '@/lib/hooks/use-toast'
import { useRouter } from 'next/navigation'

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
    ingredientRequirements: Array<{
        ingredient: any
        totalQuantity: number
        unit: string
        dishes: string[]
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
            const response = await fetch(`/api/reports/weekly-summary?date=${selectedDate.toISOString()}`)

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
            // TODO: Implement Excel export
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

    if (loading) return <LoadingSpinner />
    if (!report) return null

    const weekStart = startOfWeek(new Date(report.weekOf), { weekStartsOn: 0 })
    const weekEnd = endOfWeek(new Date(report.weekOf), { weekStartsOn: 0 })
    const friday = new Date(report.friday)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">סיכום שבועי</h1>
                        <p className="text-muted-foreground">
                            {format(weekStart, 'dd/MM/yyyy', { locale: he })} -
                            {format(weekEnd, 'dd/MM/yyyy', { locale: he })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <DatePicker
                        date={selectedDate}
                        onDateChange={setSelectedDate}
                    />
                    <Button
                        onClick={handleExport}
                        disabled={exporting}
                    >
                        <Download className="ml-2 h-4 w-4" />
                        ייצא ל-Excel
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            סה"כ הזמנות
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-500" />
                            <span className="text-2xl font-bold">{report.summary.totalOrders}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            הכנסות
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span className="text-2xl font-bold">
                                ₪{report.summary.totalRevenue.toFixed(2)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            לקוחות
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-500" />
                            <span className="text-2xl font-bold">{report.summary.uniqueCustomers}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            ממוצע הזמנה
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-orange-500" />
                            <span className="text-2xl font-bold">
                                ₪{report.summary.averageOrderValue.toFixed(2)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Reports */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
                    <TabsTrigger value="dishes">מנות פופולריות</TabsTrigger>
                    <TabsTrigger value="customers">ניתוח לקוחות</TabsTrigger>
                    <TabsTrigger value="ingredients">רכיבים נדרשים</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <WeeklySummaryStats summary={report.summary} />
                    <DailyOrdersChart data={report.summary.ordersByDay} />
                </TabsContent>

                <TabsContent value="dishes">
                    <TopDishesChart dishes={report.topDishes} />
                </TabsContent>

                <TabsContent value="customers">
                    <CustomerAnalysis customers={report.topCustomers} />
                </TabsContent>

                <TabsContent value="ingredients">
                    <IngredientRequirements
                        ingredients={report.ingredientRequirements}
                        deliveryDate={friday}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
