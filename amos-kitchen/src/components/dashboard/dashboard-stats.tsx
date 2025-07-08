// src/components/dashboard/dashboard-stats.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Package, XCircle } from 'lucide-react'

interface DashboardStatsProps {
    weekStats: {
        orders: number
        revenue: number
        pendingOrders: number
        completedOrders: number
    }
}

export function DashboardStats({ weekStats }: DashboardStatsProps) {
    const completionRate = weekStats.orders > 0 
        ? (weekStats.completedOrders / weekStats.orders) * 100 
        : 0

    const orderStatuses = [
        {
            label: 'ממתינות',
            count: weekStats.pendingOrders,
            icon: Clock,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100'
        },
        {
            label: 'הושלמו',
            count: weekStats.completedOrders,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            label: 'סה"כ',
            count: weekStats.orders,
            icon: Package,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        }
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>סטטוס הזמנות השבוע</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        {orderStatuses.map((status) => {
                            const Icon = status.icon
                            return (
                                <div key={status.label} className="text-center">
                                    <div className={`mx-auto w-12 h-12 rounded-full ${status.bgColor} flex items-center justify-center mb-2`}>
                                        <Icon className={`h-6 w-6 ${status.color}`} />
                                    </div>
                                    <div className="text-2xl font-bold">{status.count}</div>
                                    <p className="text-xs text-muted-foreground">{status.label}</p>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>אחוז השלמה</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">הזמנות שהושלמו</span>
                            <span className="text-sm text-muted-foreground">
                                {completionRate.toFixed(1)}%
                            </span>
                        </div>
                        <Progress value={completionRate} className="h-3" />
                    </div>
                    <div className="pt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span>ממוצע הכנסה להזמנה</span>
                            <span className="font-medium">
                                ₪{weekStats.orders > 0 
                                    ? (weekStats.revenue / weekStats.orders).toFixed(0)
                                    : '0'
                                }
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span>סה"כ הכנסות השבוע</span>
                            <span className="font-medium">
                                ₪{weekStats.revenue.toFixed(0)}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
