// src/components/dashboard/low-stock-alert.tsx
'use client'

import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Ingredient {
    id: string
    name: string
    unit: string
    currentStock: number
    minStock: number
}

interface LowStockAlertProps {
    ingredients: Ingredient[]
}

export function LowStockAlert({ ingredients }: LowStockAlertProps) {
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

    const criticalItems = ingredients.filter(i => i.currentStock === 0)
    const lowItems = ingredients.filter(i => i.currentStock > 0)

    return (
        <Alert variant="warning" className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>התראת מלאי נמוך</AlertTitle>
            <AlertDescription className="mt-3 space-y-3">
                <p>
                    {ingredients.length} רכיבים במלאי נמוך או חסר. 
                    יש לבצע הזמנה בהקדם.
                </p>

                {criticalItems.length > 0 && (
                    <div className="space-y-2">
                        <p className="font-medium text-red-600">רכיבים חסרים במלאי:</p>
                        <div className="flex flex-wrap gap-2">
                            {criticalItems.map(item => (
                                <Badge key={item.id} variant="destructive">
                                    {item.name} - אזל!
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {lowItems.length > 0 && (
                    <div className="space-y-2">
                        <p className="font-medium">רכיבים במלאי נמוך:</p>
                        <div className="flex flex-wrap gap-2">
                            {lowItems.map(item => (
                                <Badge key={item.id} variant="warning">
                                    {item.name} - נותרו {item.currentStock} {getUnitLabel(item.unit)}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-2 mt-4">
                    <Button size="sm" asChild>
                        <Link href="/reports/shopping-list">
                            צור רשימת קניות
                            <ArrowRight className="mr-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                        <Link href="/ingredients">
                            נהל מלאי
                        </Link>
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    )
}
