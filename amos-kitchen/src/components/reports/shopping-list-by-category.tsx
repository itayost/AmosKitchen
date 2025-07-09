// src/components/reports/shopping-list-by-category.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Package, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
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
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface CategoryGroup {
    name: string
    ingredients: Ingredient[]
    totalCost: number
}

interface Ingredient {
    id: string
    name: string
    unit: string
    unitLabel: string
    totalQuantity: number
    currentStock: number
    needToBuy: number
    estimatedCost: number
    lowStock: boolean
    usedInDishes: Array<{ dish: string; count: number }>
}

interface ShoppingListByCategoryProps {
    data: Record<string, CategoryGroup>
}

export function ShoppingListByCategory({ data }: ShoppingListByCategoryProps) {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(Object.keys(data))
    )
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

    const toggleCategory = (category: string) => {
        const newExpanded = new Set(expandedCategories)
        if (newExpanded.has(category)) {
            newExpanded.delete(category)
        } else {
            newExpanded.add(category)
        }
        setExpandedCategories(newExpanded)
    }

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

    return (
        <div className="space-y-4">
            {Object.entries(data).map(([category, group]) => {
                const isExpanded = expandedCategories.has(category)
                const lowStockCount = group.ingredients.filter(i => i.lowStock).length

                return (
                    <Collapsible
                        key={category}
                        open={isExpanded}
                        onOpenChange={() => toggleCategory(category)}
                    >
                        <Card className="overflow-hidden">
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-between p-4 h-auto"
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                        <span className="font-semibold text-base">{group.name}</span>
                                        <Badge variant="secondary">
                                            {group.ingredients.length} פריטים
                                        </Badge>
                                        {lowStockCount > 0 && (
                                            <Badge variant="destructive" className="gap-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                {lowStockCount} במלאי נמוך
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {formatCurrency(group.totalCost)}
                                    </div>
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12"></TableHead>
                                            <TableHead>רכיב</TableHead>
                                            <TableHead className="text-center">כמות</TableHead>
                                            <TableHead className="text-center">במלאי</TableHead>
                                            <TableHead className="text-center">לקנות</TableHead>
                                            <TableHead className="text-left">עלות משוערת</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.ingredients.map((ingredient) => {
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
                                                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {ingredient.totalQuantity} {ingredient.unitLabel}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {ingredient.currentStock || 0} {ingredient.unitLabel}
                                                    </TableCell>
                                                    <TableCell className="text-center font-semibold">
                                                        {ingredient.needToBuy} {ingredient.unitLabel}
                                                    </TableCell>
                                                    <TableCell className="text-left">
                                                        {formatCurrency(ingredient.estimatedCost)}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>
                )
            })}
        </div>
    )
}
