// src/app/(dashboard)/dishes/[id]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import { Edit } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DetailPageLayout } from '@/components/forms'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import Link from 'next/link'
import type { Dish } from '@/lib/types/firestore'

interface DishDetails extends Dish {
    stats: {
        totalOrders: number
        totalQuantity: number
        totalRevenue: number
    }
    orderItems: any[] // Recent orders that include this dish
}

export default function DishDetailsPage() {
    const params = useParams()
    const dishId = params.id as string

    const [dish, setDish] = useState<DishDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchDishDetails = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetchWithAuth(`/api/dishes/${dishId}`)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to fetch dish details')
            }

            const data = await response.json()
            setDish(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'אירעה שגיאה')
        } finally {
            setLoading(false)
        }
    }, [dishId])

    useEffect(() => {
        fetchDishDetails()
    }, [fetchDishDetails])

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

    // Header actions
    const headerActions = (
        <Button asChild>
            <Link href={`/dishes/${dishId}/edit`}>
                <Edit className="ml-2 h-4 w-4" />
                עריכה
            </Link>
        </Button>
    )

    // Category badge
    const categoryBadge = dish ? (
        <Badge variant="outline">{getCategoryLabel(dish.category || 'main')}</Badge>
    ) : undefined

    return (
        <DetailPageLayout
            breadcrumbs={[
                { label: 'לוח בקרה', href: '/dashboard' },
                { label: 'מנות', href: '/dishes' },
                { label: dish?.name || 'מנה' }
            ]}
            title={dish?.name || 'פרטי מנה'}
            badge={categoryBadge}
            headerActions={headerActions}
            isLoading={loading}
            loadingSkeletonConfig={{ showHeader: true, statCards: 4, sections: 1 }}
            error={error}
            onRetry={fetchDishDetails}
        >
            {dish && (
                <>
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

                        <TabsContent value="orders">
                            <Card>
                                <CardHeader>
                                    <CardTitle>הזמנות אחרונות</CardTitle>
                                    <CardDescription>
                                        20 ההזמנות האחרונות שכללו מנה זו
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {dish.orderItems && dish.orderItems.length > 0 ? (
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
                </>
            )}
        </DetailPageLayout>
    )
}
