// src/components/dashboard/top-dishes.tsx
'use client'

import { TrendingUp, Award } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface TopDish {
    dish: {
        id: string
        name: string
        category: string
        price: number
    }
    quantity: number
    orderCount: number
}

interface TopDishesProps {
    dishes: TopDish[]
}

export function TopDishes({ dishes }: TopDishesProps) {
    const maxQuantity = Math.max(...dishes.map(d => d.quantity))

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            appetizer: 'bg-blue-100 text-blue-800',
            main: 'bg-green-100 text-green-800',
            side: 'bg-yellow-100 text-yellow-800',
            dessert: 'bg-pink-100 text-pink-800',
            beverage: 'bg-purple-100 text-purple-800'
        }
        return colors[category] || 'bg-gray-100 text-gray-800'
    }

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            appetizer: 'ראשונה',
            main: 'עיקרית',
            side: 'תוספת',
            dessert: 'קינוח',
            beverage: 'משקה'
        }
        return labels[category] || category
    }

    if (dishes.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                אין מנות להצגה
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {dishes.map((item, index) => {
                const percentage = maxQuantity > 0 ? (item.quantity / maxQuantity) * 100 : 0
                
                return (
                    <div key={item.dish.id} className="space-y-2">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                                {index === 0 && (
                                    <Award className="h-4 w-4 text-yellow-500" />
                                )}
                                <div>
                                    <p className="text-sm font-medium leading-none">
                                        {item.dish.name}
                                    </p>
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
                            <div className="text-sm font-medium">
                                {item.quantity} מנות
                            </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                    </div>
                )
            })}
        </div>
    )
}
