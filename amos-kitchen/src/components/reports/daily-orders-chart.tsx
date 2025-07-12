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

    const formatCurrency = (value: number) => {
        return `₪${value.toLocaleString('he-IL')}`
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border rounded-lg shadow-lg">
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{payload[0]?.payload.shortDate}</p>
                    <div className="mt-2 space-y-1">
                        {payload.map((entry: any, index: number) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.name}: {entry.name === 'הזמנות'
                                    ? entry.value
                                    : formatCurrency(entry.value)}
                            </p>
                        ))}
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>מגמת הזמנות יומית</CardTitle>
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
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                yAxisId="left"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                style={{ fontSize: '12px' }}
                                tickFormatter={formatCurrency}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ fontSize: '14px' }}
                                iconType="line"
                            />
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="orders"
                                stroke="#8884d8"
                                fillOpacity={1}
                                fill="url(#colorOrders)"
                                name="הזמנות"
                            />
                            <Area
                                yAxisId="right"
                                type="monotone"
                                dataKey="revenue"
                                stroke="#82ca9d"
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                name="הכנסות"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                        <p className="text-muted-foreground">סה&quot;כ הזמנות</p>
                        <p className="text-2xl font-bold">{data.reduce((sum, day) => sum + day.count, 0)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-muted-foreground">סה&quot;כ הכנסות</p>
                        <p className="text-2xl font-bold">
                            {formatCurrency(data.reduce((sum, day) => sum + day.revenue, 0))}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-muted-foreground">ממוצע להזמנה</p>
                        <p className="text-2xl font-bold">
                            {formatCurrency(
                                data.reduce((sum, day) => sum + day.revenue, 0) /
                                Math.max(data.reduce((sum, day) => sum + day.count, 0), 1)
                            )}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
