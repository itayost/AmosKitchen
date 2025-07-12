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
    data: Record<string, SupplierGroup> | any
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

    // Handle empty or invalid data
    if (!data || Object.keys(data).length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                אין נתונים להצגה
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {Object.entries(data).map(([supplier, group]) => {
                // Cast group to the expected type
                const typedGroup = group as SupplierGroup
                const ingredients = Array.isArray(typedGroup?.ingredients) ? typedGroup.ingredients : []
                const totalCost = typedGroup?.totalCost || 0
                const supplierName = typedGroup?.name || supplier || 'ללא ספק'

                if (ingredients.length === 0) {
                    return null
                }

                return (
                    <Card key={supplier} className="p-6">
                        <div className="space-y-4">
                            {/* Supplier Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Building2 className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">{supplierName}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {ingredients.length} פריטים • {formatCurrency(totalCost)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Ingredients List */}
                            <div className="space-y-3">
                                {ingredients.map((ingredient) => {
                                    const isChecked = checkedItems.has(ingredient.id)

                                    return (
                                        <div
                                            key={ingredient.id}
                                            className={`flex items-center justify-between p-3 rounded-lg border ${isChecked ? 'bg-muted opacity-60' : 'hover:bg-accent/50'
                                                } transition-colors`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={isChecked}
                                                    onCheckedChange={() => toggleItem(ingredient.id)}
                                                />
                                                <div>
                                                    <p className={`font-medium ${isChecked ? 'line-through' : ''}`}>
                                                        {ingredient.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {getCategoryLabel(ingredient.category)}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {ingredient.needToBuy} {ingredient.unitLabel}
                                                        </span>
                                                        {ingredient.lowStock && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                מלאי נמוך
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{formatCurrency(ingredient.estimatedCost)}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Supplier Total */}
                            <div className="flex items-center justify-between pt-4 border-t">
                                <span className="font-semibold">סה״כ לספק:</span>
                                <span className="text-lg font-bold">{formatCurrency(totalCost)}</span>
                            </div>
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}
