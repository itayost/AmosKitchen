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
                                    : formatCurrency(entry.value)
                                }
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
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                            yAxisId="left"
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                            yAxisId="right" 
                            orientation="right"
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="revenue"
                            name="הכנסות"
                            stroke="hsl(var(--primary))"
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="orders"
                            name="הזמנות"
                            stroke="hsl(var(--destructive))"
                            fillOpacity={1}
                            fill="url(#colorOrders)"
                        />
                    </AreaChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">סה"כ הזמנות</p>
                        <p className="text-2xl font-bold">
                            {data.reduce((sum, day) => sum + day.count, 0)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">סה"כ הכנסות</p>
                        <p className="text-2xl font-bold">
                            {formatCurrency(data.reduce((sum, day) => sum + day.revenue, 0))}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">ממוצע ליום</p>
                        <p className="text-2xl font-bold">
                            {formatCurrency(
                                data.reduce((sum, day) => sum + day.revenue, 0) / (data.length || 1)
                            )}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
