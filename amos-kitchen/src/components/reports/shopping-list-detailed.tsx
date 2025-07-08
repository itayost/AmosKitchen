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
    ingredients: Ingredient[]
}

export function ShoppingListDetailed({ ingredients }: ShoppingListDetailedProps) {
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
    const [sortBy, setSortBy] = useState<'name' | 'category' | 'supplier'>('name')

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

    const sortedIngredients = [...ingredients].sort((a, b) => {
        switch (sortBy) {
            case 'category':
                return a.category.localeCompare(b.category)
            case 'supplier':
                return a.supplier.localeCompare(b.supplier)
            default:
                return a.name.localeCompare(b.name)
        }
    })

    const totalCost = ingredients.reduce((sum, ing) => sum + ing.estimatedCost, 0)
    const checkedCount = checkedItems.size
    const totalCount = ingredients.length

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {checkedCount} מתוך {totalCount} פריטים נבדקו
                </div>
                <div className="text-sm font-medium">
                    סה"כ: {formatCurrency(totalCost)}
                </div>
            </div>

            <TooltipProvider>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead 
                                className="cursor-pointer hover:text-primary"
                                onClick={() => setSortBy('name')}
                            >
                                רכיב {sortBy === 'name' && '↓'}
                            </TableHead>
                            <TableHead 
                                className="cursor-pointer hover:text-primary"
                                onClick={() => setSortBy('category')}
                            >
                                קטגוריה {sortBy === 'category' && '↓'}
                            </TableHead>
                            <TableHead 
                                className="cursor-pointer hover:text-primary"
                                onClick={() => setSortBy('supplier')}
                            >
                                ספק {sortBy === 'supplier' && '↓'}
                            </TableHead>
                            <TableHead className="text-right">כמות נדרשת</TableHead>
                            <TableHead className="text-right">במלאי</TableHead>
                            <TableHead className="text-right">לקנות</TableHead>
                            <TableHead className="text-right">עלות</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedIngredients.map((ingredient) => (
                            <TableRow 
                                key={ingredient.id}
                                className={checkedItems.has(ingredient.id) ? 'opacity-50' : ''}
                            >
                                <TableCell>
                                    <Checkbox
                                        checked={checkedItems.has(ingredient.id)}
                                        onCheckedChange={() => toggleItem(ingredient.id)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {ingredient.lowStock && (
                                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                                        )}
                                        <span className="font-medium">{ingredient.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {getCategoryLabel(ingredient.category)}
                                    </Badge>
                                </TableCell>
                                <TableCell>{ingredient.supplier}</TableCell>
                                <TableCell className="text-right">
                                    {ingredient.totalQuantity} {ingredient.unitLabel}
                                </TableCell>
                                <TableCell className="text-right">
                                    {ingredient.currentStock} {ingredient.unitLabel}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {ingredient.needToBuy > 0 ? (
                                        <span className="text-red-600">
                                            {ingredient.needToBuy} {ingredient.unitLabel}
                                        </span>
                                    ) : (
                                        <span className="text-green-600">✓</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(ingredient.estimatedCost)}
                                </TableCell>
                                <TableCell>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <div className="space-y-2">
                                                <p className="font-medium">משמש במנות:</p>
                                                <ul className="text-sm space-y-1">
                                                    {ingredient.usedInDishes.map((dish, idx) => (
                                                        <li key={idx}>
                                                            {dish.dish} ({dish.count} מנות)
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TooltipProvider>
        </div>
    )
}
