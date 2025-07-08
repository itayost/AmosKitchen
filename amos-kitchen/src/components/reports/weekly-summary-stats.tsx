// src/components/reports/weekly-summary-stats.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface WeeklySummaryStatsProps {
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
        }>
    }
}

export function WeeklySummaryStats({ summary }: WeeklySummaryStatsProps) {
    const statusLabels: Record<string, { label: string; color: string }> = {
        new: { label: 'חדש', color: 'bg-blue-500' },
        confirmed: { label: 'מאושר', color: 'bg-green-500' },
        preparing: { label: 'בהכנה', color: 'bg-yellow-500' },
        ready: { label: 'מוכן', color: 'bg-purple-500' },
        delivered: { label: 'נמסר', color: 'bg-gray-500' },
        cancelled: { label: 'בוטל', color: 'bg-red-500' }
    }

    const totalStatusOrders = Object.values(summary.ordersByStatus).reduce((a, b) => a + b, 0)

    return (
        <div className="grid gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>סטטוס הזמנות</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Object.entries(summary.ordersByStatus).map(([status, count]) => {
                        const statusInfo = statusLabels[status] || { label: status, color: 'bg-gray-500' }
                        const percentage = totalStatusOrders > 0 ? (count / totalStatusOrders) * 100 : 0

                        return (
                            <div key={status} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${statusInfo.color}`} />
                                        <span className="text-sm font-medium">{statusInfo.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{count}</span>
                                        <span className="text-sm text-muted-foreground">
                                            ({percentage.toFixed(1)}%)
                                        </span>
                                    </div>
                                </div>
                                <Progress value={percentage} className="h-2" />
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>ביצועים יומיים</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {summary.ordersByDay.map((day) => {
                            const date = new Date(day.date)
                            const dayName = date.toLocaleDateString('he-IL', { weekday: 'long' })
                            const dateStr = date.toLocaleDateString('he-IL')

                            return (
                                <div key={day.date} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div>
                                        <div className="font-medium">{dayName}</div>
                                        <div className="text-sm text-muted-foreground">{dateStr}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">{day.count} הזמנות</div>
                                        <div className="text-sm text-muted-foreground">
                                            ₪{day.revenue.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
