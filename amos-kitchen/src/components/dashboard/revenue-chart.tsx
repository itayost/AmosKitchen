// src/components/dashboard/revenue-chart.tsx
'use client'

import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'
import { Card } from '@/components/ui/card'

interface ChartDataPoint {
    date: string
    orders: number
    revenue: number
}

interface RevenueChartProps {
    data: ChartDataPoint[]
}

export function RevenueChart({ data }: RevenueChartProps) {
    const formattedData = data.map(item => ({
        ...item,
        day: format(new Date(item.date), 'EEE', { locale: he }),
        date: format(new Date(item.date), 'dd/MM'),
        revenue: Math.round(item.revenue)
    }))

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border rounded-lg shadow-lg">
                    <p className="font-medium">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.name === 'הכנסות' 
                                ? `₪${entry.value}` 
                                : entry.value
                            }
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                    dataKey="day" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <YAxis 
                    yAxisId="left"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="rect"
                />
                <Bar 
                    yAxisId="left"
                    dataKey="revenue" 
                    name="הכנסות" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                />
                <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="orders" 
                    name="הזמנות" 
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--destructive))' }}
                />
            </BarChart>
        </ResponsiveContainer>
    )
}
