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
        '#6366f1', // indigo
        '#22c55e', // green
        '#f97316', // orange
        '#a855f7', // purple
        '#ef4444', // red
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

    const getCategoryColor = (category: string) => {
        const colorMap: Record<string, string> = {
            appetizer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            main: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            side: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            dessert: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
            beverage: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
        }
        return colorMap[category] || 'bg-gray-100 text-gray-700'
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
                <div className="bg-white dark:bg-gray-800 p-4 border rounded-xl shadow-xl backdrop-blur-sm">
                    <p className="font-semibold text-base">{data.name}</p>
                    <Badge variant="secondary" className={`mt-1 text-xs ${getCategoryColor(data.category)}`}>
                        {getCategoryLabel(data.category)}
                    </Badge>
                    <div className="mt-3 space-y-1.5">
                        <p className="text-sm flex justify-between gap-4">
                            <span className="text-muted-foreground">כמות:</span>
                            <span className="font-medium">{data.quantity} מנות</span>
                        </p>
                        <p className="text-sm flex justify-between gap-4">
                            <span className="text-muted-foreground">הזמנות:</span>
                            <span className="font-medium">{data.orderCount}</span>
                        </p>
                        <p className="text-sm flex justify-between gap-4">
                            <span className="text-muted-foreground">הכנסות:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(data.revenue)}</span>
                        </p>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold">מנות לפי כמות</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" horizontal={false} />
                            <XAxis
                                type="number"
                                tick={{ fill: 'currentColor', fontSize: 12 }}
                                className="text-muted-foreground"
                            />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={100}
                                tick={{ fill: 'currentColor', fontSize: 11 }}
                                className="text-muted-foreground"
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', fillOpacity: 0.05 }} />
                            <Bar
                                dataKey="quantity"
                                name="כמות"
                                radius={[0, 4, 4, 0]}
                            >
                                {chartData.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={colors[index % colors.length]}
                                        className="transition-all duration-200 hover:opacity-80"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold">פירוט מנות מובילות</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {dishes.map((item, index) => (
                            <div
                                key={item.dish.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                        style={{ backgroundColor: colors[index % colors.length] }}
                                    >
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium">{item.dish.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge
                                                variant="secondary"
                                                className={`text-xs ${getCategoryColor(item.dish.category)}`}
                                            >
                                                {getCategoryLabel(item.dish.category)}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {item.orderCount} הזמנות
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg">{item.quantity}</p>
                                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
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
