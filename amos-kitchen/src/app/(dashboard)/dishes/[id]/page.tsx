// src/app/(dashboard)/dishes/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowRight,
    Edit,
    Package,
    DollarSign,
    ShoppingCart,
    TrendingUp,
    Calendar,
    Users
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import Link from 'next/link'
import type { Dish, OrderItem, Order } from '@/lib/types/database'

interface DishDetails extends Dish {
    ingredients: {
        id: string
        quantity: number
        notes?: string
        ingredient: {
            id: string
            name: string
            unit: string
        }
    }[]
    orderItems: (OrderItem & {
        order: Order & {
            customer: {
                id: string
                name: string
            }
        }
    })[]
    stats: {
        totalOrders: number
        totalQuantity: number
        totalRevenue: number
    }
}

export default function DishDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const dishId = params.id as string

    const [dish, setDish] = useState<DishDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchDishDetails()
    }, [dishId])

    const fetchDishDetails = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/dishes/${dishId}`)

            if (!response.ok) {
                throw new Error('Failed to fetch dish details')
            }

            const data = await response.json()
            setDish(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS'
        }).format(price)
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

    if (loading) return <LoadingSpinner />
    if (error || !dish) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-center text-muted-foreground">
                            {error || 'המנה לא נמצאה'}
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{dish.name}</h1>
                        <p className="text-muted-foreground">
                            <Badge variant="outline">{getCategoryLabel(dish.category)}</Badge>
                        </p>
                    </div>
                </div>
                <div>
                    <Button asChild>
                        <Link href={`/dishes/${dishId}/edit`}>
                            <Edit className="ml-2 h-4 w-4" />
                            עריכה
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            מחיר
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(dish.price)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            סה&quot;כ הזמנות
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dish.stats.totalOrders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            כמות כוללת
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dish.stats.totalQuantity}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            הכנסות
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatPrice(dish.stats.totalRevenue)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="details" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="details">פרטים</TabsTrigger>
                    <TabsTrigger value="ingredients">רכיבים</TabsTrigger>
                    <TabsTrigger value="orders">הזמנות אחרונות</TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                    <Card>
                        <CardHeader>
                            <CardTitle>פרטי המנה</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-1">
                                    תיאור
                                </div>
                                <p>{dish.description || 'אין תיאור'}</p>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-1">
                                    סטטוס
                                </div>
                                <Badge variant={dish.isAvailable ? 'default' : 'secondary'}>
                                    {dish.isAvailable ? 'זמין להזמנה' : 'לא זמין'}
                                </Badge>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-1">
                                    תאריך יצירה
                                </div>
                                <p>{format(new Date(dish.createdAt), 'dd/MM/yyyy', { locale: he })}</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ingredients">
                    <Card>
                        <CardHeader>
                            <CardTitle>רכיבי המנה</CardTitle>
                            <CardDescription>
                                רשימת הרכיבים והכמויות הנדרשות
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {dish.ingredients.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>רכיב</TableHead>
                                            <TableHead>כמות</TableHead>
                                            <TableHead>הערות</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dish.ingredients.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    {item.ingredient.name}
                                                </TableCell>
                                                <TableCell>
                                                    {item.quantity} {getUnitLabel(item.ingredient.unit)}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {item.notes || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    אין רכיבים מוגדרים למנה זו
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="orders">
                    <Card>
                        <CardHeader>
                            <CardTitle>הזמנות אחרונות</CardTitle>
                            <CardDescription>
                                20 ההזמנות האחרונות שכללו מנה זו
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {dish.orderItems.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>תאריך</TableHead>
                                            <TableHead>לקוח</TableHead>
                                            <TableHead>כמות</TableHead>
                                            <TableHead>סטטוס</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dish.orderItems.slice(0, 20).map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    {format(new Date(item.createdAt), 'dd/MM/yyyy', { locale: he })}
                                                </TableCell>
                                                <TableCell>
                                                    <Link
                                                        href={`/customers/${item.order.customer.id}`}
                                                        className="text-primary hover:underline"
                                                    >
                                                        {item.order.customer.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {item.order.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    אין הזמנות עדיין
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
