// src/components/ingredients/ingredient-list.tsx
'use client'

import { Edit, Trash2, MoreVertical, Package, AlertTriangle } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import type { Ingredient } from '@/lib/types/database'

interface IngredientWithStats extends Ingredient {
    dishCount: number
    dishes: {
        dish: {
            id: string
            name: string
            isAvailable: boolean
        }
    }[]
}

interface IngredientListProps {
    ingredients: IngredientWithStats[]
    onEdit: (ingredient: IngredientWithStats) => void
    onDelete: (ingredientId: string) => void
}

export function IngredientList({ ingredients, onEdit, onDelete }: IngredientListProps) {
    const formatCurrency = (amount: number | null) => {
        if (!amount) return '-'
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS'
        }).format(amount)
    }

    const getStockStatus = (current: number | null, min: number | null) => {
        if (current === null || min === null) return null

        if (current === 0) {
            return { label: 'אזל', variant: 'destructive' as const, icon: AlertTriangle }
        } else if (current < min) {
            return { label: 'מלאי נמוך', variant: 'destructive' as const, icon: AlertTriangle }
        } else if (current < min * 1.5) {
            return { label: 'מלאי בינוני', variant: 'secondary' as const, icon: Package }
        } else {
            return { label: 'מלאי תקין', variant: 'default' as const, icon: Package }
        }
    }

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

    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[250px]">רכיב</TableHead>
                        <TableHead>יחידת מידה</TableHead>
                        <TableHead className="text-center">מלאי נוכחי</TableHead>
                        <TableHead className="text-center">מלאי מינימלי</TableHead>
                        <TableHead>ספק</TableHead>
                        <TableHead className="text-right">עלות ליחידה</TableHead>
                        <TableHead className="text-center">מנות</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ingredients.map((ingredient) => {
                        const stockStatus = getStockStatus(
                            ingredient.currentStock ?? null,
                            ingredient.minStock ?? null
                        )

                        return (
                            <TableRow key={ingredient.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        {stockStatus && stockStatus.variant === 'destructive' && (
                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                        )}
                                        {ingredient.name}
                                    </div>
                                </TableCell>
                                <TableCell>{getUnitLabel(ingredient.unit)}</TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        {ingredient.currentStock ?? '-'}
                                        {stockStatus && (
                                            <Badge variant={stockStatus.variant} className="text-xs">
                                                {stockStatus.label}
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    {ingredient.minStock ?? '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                    {ingredient.dishCount > 0 ? (
                                        <div className="text-sm">
                                            <span className="font-medium">{ingredient.dishCount}</span>
                                            <div className="text-xs text-muted-foreground">
                                                {ingredient.dishes.slice(0, 2).map(item =>
                                                    item.dish.name
                                                ).join(', ')}
                                                {ingredient.dishes.length > 2 && ' ...'}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>פעולות</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => onEdit(ingredient)}>
                                                <Edit className="ml-2 h-4 w-4" />
                                                עריכה
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => onDelete(ingredient.id)}
                                                className="text-red-600"
                                                disabled={ingredient.dishCount > 0}
                                            >
                                                <Trash2 className="ml-2 h-4 w-4" />
                                                מחיקה
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                    {ingredients.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                לא נמצאו רכיבים
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Card>
    )
}
