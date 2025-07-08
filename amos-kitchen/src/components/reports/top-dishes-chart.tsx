// src/components/reports/top-dishes-chart.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts'

interface TopDish {
    dish: {
        id: string
        name: string
        category: string
        price: number
    }
    quantity: number
    revenue: number
    orderCount: number
}

interface TopDishesChartProps {
    dishes: TopDish[]
}

export function TopDishesChart({ dishes }: TopDishesChartProps) {
    const chartData = dishes.map(item => ({
        name: item.dish.name,
        quantity: item.quantity,
        revenue: item.revenue,
        orderCount: item.orderCount,
        category: item.dish.category
    }))

    const colors = [
        'hsl(var(--chart-1))',
        'hsl(var(--chart-2))',
        'hsl(var(--chart-3))',
        'hsl(var(--chart-4))',
        'hsl(var(--chart-5))'
    ]

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            appetizer: 'מנה ראשונה',
            main: 'מנה עיקרית',
            side: 'תוספת',
            dessert: 'קינוח',
            beverage: 'משקה'
        }
        return labels[category] || category
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS',
            minimumFractionDigits: 0
        }).format(value)
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-white p-3 border rounded-lg shadow-lg">
                    <p className="font-medium">{data.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {getCategoryLabel(data.category)}
                    </p>
                    <div className="mt-2 space-y-1">
                        <p className="text-sm">כמות: {data.quantity} מנות</p>
                        <p className="text-sm">הזמנות: {data.orderCount}</p>
                        <p className="text-sm font-medium">
                            הכנסות: {formatCurrency(data.revenue)}
                        </p>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>מנות לפי כמות</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="name" 
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                interval={0}
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="quantity" name="כמות">
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>פירוט מנות מובילות</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {dishes.map((item, index) => (
                            <div key={item.dish.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: colors[index % colors.length] }}
                                    />
                                    <div>
                                        <p className="font-medium">{item.dish.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="secondary" className="text-xs">
                                                {getCategoryLabel(item.dish.category)}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {item.orderCount} הזמנות
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">{item.quantity} מנות</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatCurrency(item.revenue)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
