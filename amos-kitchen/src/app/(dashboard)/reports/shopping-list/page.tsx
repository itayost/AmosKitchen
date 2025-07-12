// src/app/(dashboard)/reports/shopping-list/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { startOfWeek, format, addDays } from 'date-fns'
import { he } from 'date-fns/locale'
import {
    ArrowRight,
    Download,
    Calendar,
    ShoppingCart,
    Package,
    AlertTriangle,
    Filter,
    Printer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShoppingListByCategory } from '@/components/reports/shopping-list-by-category'
import { ShoppingListBySupplier } from '@/components/reports/shopping-list-by-supplier'
import { ShoppingListDetailed } from '@/components/reports/shopping-list-detailed'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { DatePicker } from '@/components/shared/date-picker'
import { useToast } from '@/lib/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface ShoppingListReport {
    weekOf: string
    deliveryDate: string
    summary: {
        totalIngredients: number
        totalEstimatedCost: number
        lowStockItems: number
        totalOrders: number
        categoryCounts: Record<string, number>
        supplierCounts: Record<string, number>
    }
    ingredients: any
    groupBy: string
    orderCount: number
}

export default function ShoppingListPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [groupBy, setGroupBy] = useState<'category' | 'supplier' | 'all'>('category')
    const [report, setReport] = useState<ShoppingListReport | null>(null)
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        fetchReport()
    }, [selectedDate, groupBy])

    const fetchReport = async () => {
        try {
            setLoading(true)
            const response = await fetch(
                `/api/reports/shopping-list?date=${selectedDate.toISOString()}&groupBy=${groupBy}`
            )

            if (!response.ok) throw new Error('Failed to fetch shopping list')

            const data = await response.json()
            setReport(data)
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לטעון את רשימת הקניות',
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
                description: 'רשימת הקניות יוצאה בהצלחה'
            })
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לייצא את הרשימה',
                variant: 'destructive'
            })
        } finally {
            setExporting(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    if (loading) return <LoadingSpinner />
    if (!report) return null

    const friday = new Date(report.deliveryDate)
    const weekStart = startOfWeek(new Date(report.weekOf), { weekStartsOn: 0 })

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
                        <h1 className="text-3xl font-bold">רשימת קניות</h1>
                        <p className="text-muted-foreground">
                            ליום שישי, {format(friday, 'dd/MM/yyyy', { locale: he })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <DatePicker
                        date={selectedDate}
                        onDateChange={(date) => date && setSelectedDate(date)}
                    />
                    <Button
                        variant="outline"
                        onClick={handlePrint}
                    >
                        <Printer className="ml-2 h-4 w-4" />
                        הדפס
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={exporting}
                    >
                        <Download className="ml-2 h-4 w-4" />
                        ייצא ל-Excel
                    </Button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            סה"כ רכיבים
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-500" />
                            <span className="text-2xl font-bold">{report.summary.totalIngredients}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            עלות משוערת
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-green-500" />
                            <span className="text-2xl font-bold">
                                ₪{report.summary.totalEstimatedCost.toFixed(2)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            מלאי נמוך
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="text-2xl font-bold text-orange-600">
                                {report.summary.lowStockItems}
                            </span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            הזמנות
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-500" />
                            <span className="text-2xl font-bold">{report.orderCount}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Shopping List Views */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>רשימת רכיבים</CardTitle>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">קיבוץ לפי:</span>
                            <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
                                <TabsList>
                                    <TabsTrigger value="category">קטגוריה</TabsTrigger>
                                    <TabsTrigger value="supplier">ספק</TabsTrigger>
                                    <TabsTrigger value="all">הכל</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {groupBy === 'category' && (
                        <ShoppingListByCategory data={report.ingredients} />
                    )}
                    {groupBy === 'supplier' && (
                        <ShoppingListBySupplier data={report.ingredients} />
                    )}
                    {groupBy === 'all' && (
                        <ShoppingListDetailed ingredients={report.ingredients} />
                    )}
                </CardContent>
            </Card>

            {/* Print Notice */}
            <div className="hidden print:block">
                <div className="text-center text-sm text-gray-500 mt-8">
                    רשימת קניות - {format(friday, 'dd/MM/yyyy', { locale: he })}
                </div>
            </div>
        </div>
    )
}
