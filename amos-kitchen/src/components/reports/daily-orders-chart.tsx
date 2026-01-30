// src/components/reports/daily-orders-chart.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

interface DailyData {
    date: string
    count: number
    revenue: number
    dishes: Record<string, number>
}

interface DailyOrdersChartProps {
    data: DailyData[]
}

export function DailyOrdersChart({ data }: DailyOrdersChartProps) {
    const chartData = data.map(day => ({
        date: format(new Date(day.date), 'EEEE', { locale: he }),
        shortDate: format(new Date(day.date), 'dd/MM'),
        orders: day.count,
        revenue: Math.round(day.revenue),
        avgOrder: day.count > 0 ? Math.round(day.revenue / day.count) : 0
    }))

    // Calculate totals
    const totalOrders = data.reduce((sum, day) => sum + day.count, 0)
    const totalRevenue = data.reduce((sum, day) => sum + day.revenue, 0)
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const formatCurrency = (value: number) => {
        return `₪${Math.round(value).toLocaleString('he-IL')}`
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-4 border rounded-xl shadow-xl backdrop-blur-sm">
                    <p className="font-semibold text-base">{label}</p>
                    <p className="text-sm text-muted-foreground mb-2">{payload[0]?.payload.shortDate}</p>
                    <div className="space-y-1.5">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-sm">
                                    {entry.name}: {' '}
                                    <span className="font-medium">
                                        {entry.name === 'הזמנות' ? entry.value : formatCurrency(entry.value)}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">מגמת הזמנות יומית</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                            <XAxis
                                dataKey="date"
                                style={{ fontSize: '12px' }}
                                tick={{ fill: 'currentColor' }}
                                className="text-muted-foreground"
                            />
                            <YAxis
                                yAxisId="left"
                                style={{ fontSize: '12px' }}
                                tick={{ fill: 'currentColor' }}
                                className="text-muted-foreground"
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                style={{ fontSize: '12px' }}
                                tickFormatter={formatCurrency}
                                tick={{ fill: 'currentColor' }}
                                className="text-muted-foreground"
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ stroke: 'currentColor', strokeOpacity: 0.1 }}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
                                iconType="circle"
                            />
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="orders"
                                stroke="#6366f1"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorOrders)"
                                name="הזמנות"
                            />
                            <Area
                                yAxisId="right"
                                type="monotone"
                                dataKey="revenue"
                                stroke="#22c55e"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                name="הכנסות"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Summary Stats */}
                <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                        <p className="text-sm text-muted-foreground mb-1">סה&quot;כ הזמנות</p>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {totalOrders}
                        </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                        <p className="text-sm text-muted-foreground mb-1">סה&quot;כ הכנסות</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(totalRevenue)}
                        </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                        <p className="text-sm text-muted-foreground mb-1">ממוצע להזמנה</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {formatCurrency(avgOrder)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
