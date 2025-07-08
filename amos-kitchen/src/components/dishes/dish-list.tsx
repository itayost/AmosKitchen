// src/components/dishes/dish-list.tsx
'use client'

import { Edit, Trash2, MoreVertical, Eye } from 'lucide-react'
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
import type { Dish } from '@/lib/types/database'

interface DishWithStats extends Dish {
    orderCount: number
    ingredients: {
        ingredient: {
            name: string
        }
    }[]
}

interface DishListProps {
    dishes: DishWithStats[]
    onEdit: (dish: DishWithStats) => void
    onDelete: (dishId: string) => void
}

export function DishList({ dishes, onEdit, onDelete }: DishListProps) {
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
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">מנה</TableHead>
                        <TableHead>קטגוריה</TableHead>
                        <TableHead className="text-right">מחיר</TableHead>
                        <TableHead className="text-center">זמינות</TableHead>
                        <TableHead className="text-center">הזמנות</TableHead>
                        <TableHead className="text-right">רכיבים</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {dishes.map((dish) => (
                        <TableRow key={dish.id}>
                            <TableCell className="font-medium">
                                <div>
                                    <div className="font-medium">{dish.name}</div>
                                    {dish.description && (
                                        <div className="text-sm text-muted-foreground">
                                            {dish.description}
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge className={getCategoryColor(dish.category)}>
                                    {getCategoryLabel(dish.category)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {formatPrice(dish.price)}
                            </TableCell>
                            <TableCell className="text-center">
                                <Badge variant={dish.isAvailable ? 'success' : 'secondary'}>
                                    {dish.isAvailable ? 'זמין' : 'לא זמין'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                                {dish.orderCount}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="text-sm">
                                    {dish.ingredients.length > 0 ? (
                                        <span className="text-muted-foreground">
                                            {dish.ingredients.slice(0, 3).map(ing =>
                                                ing.ingredient.name
                                            ).join(', ')}
                                            {dish.ingredients.length > 3 && ' ...'}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">אין רכיבים</span>
                                    )}
                                </div>
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
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dishes/${dish.id}`}>
                                                <Eye className="ml-2 h-4 w-4" />
                                                צפה בפרטים
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onEdit(dish)}>
                                            <Edit className="ml-2 h-4 w-4" />
                                            עריכה
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => onDelete(dish.id)}
                                            className="text-red-600"
                                            disabled={dish.orderCount > 0}
                                        >
                                            <Trash2 className="ml-2 h-4 w-4" />
                                            מחיקה
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    {dishes.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                לא נמצאו מנות
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Card>
    )
}
