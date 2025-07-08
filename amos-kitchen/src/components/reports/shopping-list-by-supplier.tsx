// src/components/reports/shopping-list-by-supplier.tsx
'use client'

import { useState } from 'react'
import { Building2, Phone, Package } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'

interface SupplierGroup {
    name: string
    ingredients: Ingredient[]
    totalCost: number
}

interface Ingredient {
    id: string
    name: string
    category: string
    unit: string
    unitLabel: string
    totalQuantity: number
    needToBuy: number
    estimatedCost: number
    lowStock: boolean
}

interface ShoppingListBySupplierProps {
    data: Record<string, SupplierGroup>
}

export function ShoppingListBySupplier({ data }: ShoppingListBySupplierProps) {
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

    const toggleItem = (itemId: string) => {
        const newChecked = new Set(checkedItems)
        if (newChecked.has(itemId)) {
            newChecked.delete(itemId)
        } else {
            newChecked.add(itemId)
        }
        setCheckedItems(newChecked)
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS'
        }).format(amount)
    }

    const getCategoryLabel = (category: string) => {
        const categories: Record<string, string> = {
            vegetables: 'ירקות',
            fruits: 'פירות',
            meat: 'בשר',
            dairy: 'חלב',
            grains: 'דגנים',
            spices: 'תבלינים',
            oils: 'שמנים',
            other: 'אחר'
        }
        return categories[category] || category
    }

    return (
        <div className="space-y-6">
            {Object.entries(data).map(([supplier, group]) => (
                <Card key={supplier} className="p-6">
                    <div className="space-y-4">
                        {/* Supplier Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">{group.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {group.ingredients.length} פריטים • {formatCurrency(group.totalCost)}
                                    </p>
                                </div>
                            </div>
                            <Badge variant="outline" className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                להזמנה
                            </Badge>
                        </div>

                        <Separator />

                        {/* Ingredients List */}
                        <div className="space-y-3">
                            {group.ingredients.map((ingredient) => (
                                <div 
                                    key={ingredient.id}
                                    className={`flex items-center justify-between py-2 ${
                                        checkedItems.has(ingredient.id) ? 'opacity-50' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            checked={checkedItems.has(ingredient.id)}
                                            onCheckedChange={() => toggleItem(ingredient.id)}
                                        />
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{ingredient.name}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {getCategoryLabel(ingredient.category)}
                                            </Badge>
                                            {ingredient.lowStock && (
                                                <Badge variant="warning" className="text-xs">
                                                    מלאי נמוך
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="text-right">
                                            <div className="font-medium">
                                                {ingredient.needToBuy > 0 ? (
                                                    <span className="text-red-600">
                                                        {ingredient.needToBuy} {ingredient.unitLabel}
                                                    </span>
                                                ) : (
                                                    <span className="text-green-600">במלאי</span>
                                                )}
                                            </div>
                                            <div className="text-muted-foreground">
                                                נדרש: {ingredient.totalQuantity} {ingredient.unitLabel}
                                            </div>
                                        </div>
                                        <div className="text-right font-medium">
                                            {formatCurrency(ingredient.estimatedCost)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Supplier Summary */}
                        <div className="pt-4 border-t">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    סה"כ לספק:
                                </span>
                                <span className="font-bold text-lg">
                                    {formatCurrency(group.totalCost)}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}
