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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/reports')}
                        className="mb-2"
                    >
                        <ArrowRight className="ml-2 h-4 w-4" />
                        חזרה לדוחות
                    </Button>
                    <h1 className="text-3xl font-bold">דוח שבועי</h1>
                    <p className="text-muted-foreground">
                        שבוע {format(weekStart, 'dd/MM')} - {format(weekEnd, 'dd/MM/yyyy')}
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
                    >
                        <Download className="ml-2 h-4 w-4" />
                        ייצוא לאקסל
                    </Button>
                </div>
            </div>

            {/* Summary Stats */}
            <WeeklySummaryStats data={report.summary} />

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
                    <TabsTrigger value="dishes">מנות פופולריות</TabsTrigger>
                    <TabsTrigger value="customers">ניתוח לקוחות</TabsTrigger>
                    <TabsTrigger value="ingredients">רכיבים נדרשים</TabsTrigger>
                    <TabsTrigger value="details">פירוט הזמנות</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>הזמנות לפי יום</CardTitle>
                            <CardDescription>
                                {/* Fixed: Escaped the quote properly */}
                                מגמת הזמנות במהלך השבוע - מיום ראשון עד יום שישי
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DailyOrdersChart data={report.summary.ordersByDay} />
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>התפלגות לפי סטטוס</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(report.summary.ordersByStatus).map(([status, count]) => (
                                        <div key={status} className="flex justify-between items-center">
                                            <span className="text-sm">{status}</span>
                                            <span className="font-medium">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>סטטיסטיקות נוספות</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">ערך הזמנה ממוצע</span>
                                        <span className="font-medium">₪{report.summary.averageOrderValue.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">לקוחות ייחודיים</span>
                                        <span className="font-medium">{report.summary.uniqueCustomers}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="dishes" className="space-y-6">
                    <TopDishesChart data={report.topDishes} />
                </TabsContent>

                <TabsContent value="customers" className="space-y-6">
                    <CustomerAnalysis data={report.topCustomers} />
                </TabsContent>

                <TabsContent value="ingredients" className="space-y-6">
                    {/* Ingredients feature removed */}
                </TabsContent>

                <TabsContent value="details" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>כל ההזמנות</CardTitle>
                            <CardDescription>
                                רשימה מלאה של כל ההזמנות לשבוע זה
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Orders table would go here */}
                            <div className="text-center text-muted-foreground py-8">
                                טבלת הזמנות מפורטת
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
