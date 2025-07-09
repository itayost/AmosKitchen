// src/components/reports/shopping-list-detailed.tsx
'use client'

import { useState } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

interface Ingredient {
    id: string
    name: string
    category: string
    supplier: string
    unit: string
    unitLabel: string
    totalQuantity: number
    currentStock: number
    needToBuy: number
    estimatedCost: number
    lowStock: boolean
    usedInDishes: Array<{ dish: string; count: number }>
}

interface ShoppingListDetailedProps {
    ingredients: Ingredient[] | Record<string, any>
}

export function ShoppingListDetailed({ ingredients }: ShoppingListDetailedProps) {
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
    const [sortBy, setSortBy] = useState<'name' | 'category' | 'supplier'>('name')

    // Convert ingredients to array if it's an object
    const ingredientsList: Ingredient[] = Array.isArray(ingredients)
        ? ingredients
        : Object.values(ingredients).flatMap((group: any) =>
            Array.isArray(group.ingredients) ? group.ingredients : []
          )

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

    if (!ingredientsList || ingredientsList.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                אין רכיבים להצגה
            </div>
        )
    }

    const sortedIngredients = [...ingredientsList].sort((a, b) => {
        switch (sortBy) {
            case 'category':
                return a.category.localeCompare(b.category)
            case 'supplier':
                return (a.supplier || '').localeCompare(b.supplier || '')
            default:
                return a.name.localeCompare(b.name)
        }
    })

    const totalCost = sortedIngredients.reduce((sum, item) => sum + item.estimatedCost, 0)
    const checkedCount = checkedItems.size
    const totalCount = sortedIngredients.length

    return (
        <TooltipProvider>
            <div className="space-y-4">
                {/* Summary Bar */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            {checkedCount} מתוך {totalCount} סומנו
                        </span>
                        <div className="h-4 w-px bg-border" />
                        <span className="text-sm font-medium">
                            סה״כ: {formatCurrency(totalCost)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">מיון לפי:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="text-sm border rounded px-2 py-1"
                        >
                            <option value="name">שם</option>
                            <option value="category">קטגוריה</option>
                            <option value="supplier">ספק</option>
                        </select>
                    </div>
                </div>

                {/* Ingredients Table */}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>רכיב</TableHead>
                            <TableHead>קטגוריה</TableHead>
                            <TableHead>ספק</TableHead>
                            <TableHead className="text-center">נדרש</TableHead>
                            <TableHead className="text-center">במלאי</TableHead>
                            <TableHead className="text-center">לקנות</TableHead>
                            <TableHead>עלות</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedIngredients.map((ingredient) => {
                            const isChecked = checkedItems.has(ingredient.id)
                            return (
                                <TableRow
                                    key={ingredient.id}
                                    className={isChecked ? 'opacity-50' : ''}
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={() => toggleItem(ingredient.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={isChecked ? 'line-through' : ''}>
                                                {ingredient.name}
                                            </span>
                                            {ingredient.lowStock && (
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <AlertTriangle className="h-4 w-4 text-destructive" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        מלאי נמוך
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {getCategoryLabel(ingredient.category)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{ingredient.supplier || '-'}</TableCell>
                                    <TableCell className="text-center">
                                        {ingredient.totalQuantity} {ingredient.unitLabel}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {ingredient.currentStock || 0} {ingredient.unitLabel}
                                    </TableCell>
                                    <TableCell className="text-center font-semibold">
                                        {ingredient.needToBuy} {ingredient.unitLabel}
                                    </TableCell>
                                    <TableCell>{formatCurrency(ingredient.estimatedCost)}</TableCell>
                                    <TableCell>
                                        {ingredient.usedInDishes && ingredient.usedInDishes.length > 0 && (
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Info className="h-4 w-4 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <div className="space-y-1">
                                                        <p className="font-semibold">משמש במנות:</p>
                                                        {ingredient.usedInDishes.map((dish, idx) => (
                                                            <p key={idx} className="text-sm">
                                                                {dish.dish} ({dish.count})
                                                            </p>
                                                        ))}
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </TooltipProvider>
    )
}
