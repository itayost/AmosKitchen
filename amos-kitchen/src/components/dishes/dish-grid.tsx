// src/components/dishes/dish-grid.tsx
'use client'

import { Edit, Trash2, ShoppingCart } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Dish } from '@/lib/types/database'

interface DishWithStats extends Dish {
    orderCount: number
    ingredients: {
        ingredient: {
            name: string
        }
    }[]
}

interface DishGridProps {
    dishes: DishWithStats[]
    onEdit: (dish: DishWithStats) => void
    onDelete: (dishId: string) => void
}

export function DishGrid({ dishes, onEdit, onDelete }: DishGridProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS'
        }).format(price)
    }

    const getCategoryLabel = (category: string) => {
        const categories: Record<string, string> = {
            appetizer: 'מנה ראשונה',
            main: 'מנה עיקרית',
            side: 'תוספת',
            dessert: 'קינוח',
            beverage: 'משקה'
        }
        return categories[category] || category
    }

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

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {dishes.map((dish) => (
                <Card key={dish.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{dish.name}</CardTitle>
                            <Badge className={getCategoryColor(dish.category)}>
                                {getCategoryLabel(dish.category)}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                        <div className="space-y-3">
                            {dish.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {dish.description}
                                </p>
                            )}
                            
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold">
                                    {formatPrice(dish.price)}
                                </span>
                                <Badge variant={dish.isAvailable ? 'success' : 'secondary'}>
                                    {dish.isAvailable ? 'זמין' : 'לא זמין'}
                                </Badge>
                            </div>

                            {dish.ingredients.length > 0 && (
                                <div className="text-xs text-muted-foreground">
                                    <span className="font-medium">רכיבים: </span>
                                    {dish.ingredients.slice(0, 3).map(ing => 
                                        ing.ingredient.name
                                    ).join(', ')}
                                    {dish.ingredients.length > 3 && ' ...'}
                                </div>
                            )}

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ShoppingCart className="h-4 w-4" />
                                <span>{dish.orderCount} הזמנות</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-3 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            asChild
                        >
                            <Link href={`/dishes/${dish.id}`}>
                                פרטים
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(dish)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(dish.id)}
                            disabled={dish.orderCount > 0}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            ))}
            {dishes.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                    לא נמצאו מנות
                </div>
            )}
        </div>
    )
}
