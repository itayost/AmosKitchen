// src/components/reports/ingredient-requirements.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, AlertTriangle, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import Link from 'next/link'

interface IngredientRequirement {
    ingredient: {
        id: string
        name: string
        unit: string
        currentStock?: number
        minStock?: number
        supplier?: string
    }
    totalQuantity: number
    unit: string
    dishes: string[]
}

interface IngredientRequirementsProps {
    ingredients: IngredientRequirement[]
    deliveryDate: Date
}

export function IngredientRequirements({ ingredients, deliveryDate }: IngredientRequirementsProps) {
    const getUnitLabel = (unit: string) => {
        const units: Record<string, string> = {
            kg: 'ק"ג',
            gram: 'גרם',
            liter: 'ליטר',
            ml: 'מ"ל',
            unit: 'יחידה'
        }
        return units[unit] || unit
    }

    const getCategoryFromIngredient = (name: string): string => {
        // Simple categorization based on name - in real app this would be from DB
        if (['עגבניה', 'מלפפון', 'בצל', 'חסה', 'פלפל'].some(v => name.includes(v))) {
            return 'ירקות'
        } else if (['עוף', 'בשר', 'קבב'].some(v => name.includes(v))) {
            return 'בשר'
        } else if (['חלב', 'גבינה', 'ביצה'].some(v => name.includes(v))) {
            return 'חלב'
        } else if (['אורז', 'פסטה', 'קוסקוס'].some(v => name.includes(v))) {
            return 'דגנים'
        } else if (['שמן', 'זית'].some(v => name.includes(v))) {
            return 'שמנים'
        }
        return 'אחר'
    }

    const categorizedIngredients = ingredients.reduce((acc, item) => {
        const category = getCategoryFromIngredient(item.ingredient.name)
        if (!acc[category]) {
            acc[category] = []
        }
        acc[category].push(item)
        return acc
    }, {} as Record<string, IngredientRequirement[]>)

    const lowStockIngredients = ingredients.filter(item => {
        if (!item.ingredient.currentStock || !item.ingredient.minStock) return false
        return item.ingredient.currentStock < item.totalQuantity
    })

    return (
        <div className="space-y-4">
            {lowStockIngredients.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-800">
                            <AlertTriangle className="h-5 w-5" />
                            התראת מלאי
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-orange-700 mb-3">
                            {lowStockIngredients.length} רכיבים במלאי נמוך מהכמות הנדרשת
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {lowStockIngredients.map(item => (
                                <Badge key={item.ingredient.id} variant="warning">
                                    {item.ingredient.name} - נדרש {item.totalQuantity} {getUnitLabel(item.unit)}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>רכיבים נדרשים</CardTitle>
                            <CardDescription>
                                ליום שישי, {format(deliveryDate, 'dd בMMMM', { locale: he })}
                            </CardDescription>
                        </div>
                        <Button asChild>
                            <Link href={`/reports/shopping-list?date=${deliveryDate.toISOString()}`}>
                                <FileText className="ml-2 h-4 w-4" />
                                רשימת קניות מלאה
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {Object.entries(categorizedIngredients).map(([category, items]) => (
                            <div key={category}>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    {category}
                                </h4>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {items.map(item => (
                                        <div 
                                            key={item.ingredient.id}
                                            className="flex items-center justify-between p-3 rounded-lg border"
                                        >
                                            <div>
                                                <p className="font-medium">{item.ingredient.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    משמש ב-{item.dishes.length} מנות
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">
                                                    {item.totalQuantity} {getUnitLabel(item.unit)}
                                                </p>
                                                {item.ingredient.supplier && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.ingredient.supplier}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
