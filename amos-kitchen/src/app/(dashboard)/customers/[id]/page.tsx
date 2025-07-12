// app/(dashboard)/customers/[id]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowRight,
    Edit,
    Phone,
    Mail,
    MapPin,
    Calendar,
    ShoppingCart,
    DollarSign,
    TrendingUp,
    FileText,
    Heart,
    AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import type { Customer, Order, OrderItem, Dish } from '@/lib/types/database'

interface CustomerDetails extends Customer {
    orders: (Order & {
        orderItems: (OrderItem & {
            dish: Dish
        })[]
    })[]
}

interface DishStats {
    dishId: string
    dishName: string
    orderCount: number
    totalQuantity: number
    totalRevenue: number
}

export default function CustomerProfilePage() {
    const params = useParams()
    const router = useRouter()
    const customerId = params.id as string

    const [customer, setCustomer] = useState<CustomerDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCustomerDetails = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/customers/${customerId}`)

            if (!response.ok) {
                throw new Error('Failed to fetch customer details')
            }

            const data = await response.json()
            setCustomer(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }, [customerId])

    useEffect(() => {
        fetchCustomerDetails()
    }, [fetchCustomerDetails])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        )
    }

    if (error || !customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-xl font-semibold">שגיאה בטעינת פרטי הלקוח</p>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => router.push('/customers')}>
                    חזרה לרשימת לקוחות
                </Button>
            </div>
        )
    }

    // Calculate statistics
    const stats = {
        totalOrders: customer.orders.length,
        totalSpent: customer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
        lastOrder: customer.orders.length > 0
            ? customer.orders.reduce((latest, order) =>
                new Date(order.createdAt) > new Date(latest.createdAt) ? order : latest
            )
            : null,
        avgOrderValue: customer.orders.length > 0
            ? customer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0) / customer.orders.length
            : 0
    }

    // Calculate favorite dishes
    const dishStatsMap = new Map<string, DishStats>()
    customer.orders.forEach(order => {
        order.orderItems.forEach(item => {
            const existing = dishStatsMap.get(item.dishId) || {
                dishId: item.dishId,
                dishName: item.dish.name,
                orderCount: 0,
                totalQuantity: 0,
                totalRevenue: 0
            }
            existing.orderCount++
            existing.totalQuantity += item.quantity
            existing.totalRevenue += item.quantity * item.price
            dishStatsMap.set(item.dishId, existing)
        })
    })
    const favoriteDishes = Array.from(dishStatsMap.values())
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 5)

    const getStatusColor = (status: string) => {
        const colors = {
            new: 'bg-blue-100 text-blue-800',
            confirmed: 'bg-green-100 text-green-800',
            preparing: 'bg-yellow-100 text-yellow-800',
            ready: 'bg-purple-100 text-purple-800',
            delivered: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-red-100 text-red-800'
        }
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    }

    const getStatusText = (status: string) => {
        const texts = {
            new: 'חדשה',
            confirmed: 'אושרה',
            preparing: 'בהכנה',
            ready: 'מוכנה',
            delivered: 'נמסרה',
            cancelled: 'בוטלה'
        }
        return texts[status as keyof typeof texts] || status
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/customers')}
                    >
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{customer.name}</h1>
                        <p className="text-muted-foreground">
                            לקוח מאז {format(new Date(customer.createdAt), 'dd/MM/yyyy', { locale: he })}
                        </p>
                    </div>
                </div>
                <Button onClick={() => router.push(`/customers/${customerId}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    ערוך פרטים
                </Button>
            </div>

            {/* Contact Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle>פרטי התקשרות</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">טלפון:</span>
                        <a href={`tel:${customer.phone}`} className="text-primary hover:underline">
                            {customer.phone}
                        </a>
                    </div>
                    {customer.email && (
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">אימייל:</span>
                            <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                                {customer.email}
                            </a>
                        </div>
                    )}
                    {customer.address && (
                        <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="font-medium">כתובת:</span>
                            <span>{customer.address}</span>
                        </div>
                    )}
                    {customer.notes && (
                        <div className="flex items-start gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="font-medium">הערות:</span>
                            <span className="text-muted-foreground">{customer.notes}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            סה&quot;כ הזמנות
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                            <span className="text-2xl font-bold">{stats.totalOrders}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            סה&quot;כ הוצאות
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <span className="text-2xl font-bold">₪{stats.totalSpent.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            ממוצע הזמנה
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="text-2xl font-bold">₪{stats.avgOrderValue.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            הזמנה אחרונה
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="text-2xl font-bold">
                                {stats.lastOrder
                                    ? format(new Date(stats.lastOrder.createdAt), 'dd/MM', { locale: he })
                                    : 'אין'
                                }
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="orders" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="orders">היסטוריית הזמנות</TabsTrigger>
                    <TabsTrigger value="favorites">מנות מועדפות</TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="space-y-4">
                    {customer.orders.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <p className="text-muted-foreground">אין הזמנות קודמות</p>
                                <Button
                                    className="mt-4"
                                    onClick={() => router.push('/orders/new')}
                                >
                                    צור הזמנה חדשה
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>מספר הזמנה</TableHead>
                                        <TableHead>תאריך</TableHead>
                                        <TableHead>סטטוס</TableHead>
                                        <TableHead>מנות</TableHead>
                                        <TableHead>סכום</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customer.orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">
                                                {order.orderNumber}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(order.deliveryDate), 'dd/MM/yyyy', { locale: he })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(order.status)}>
                                                    {getStatusText(order.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                                            </TableCell>
                                            <TableCell>₪{Number(order.totalAmount).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.push(`/orders/${order.id}`)}
                                                >
                                                    צפה
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="favorites" className="space-y-4">
                    {favoriteDishes.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <p className="text-muted-foreground">אין מנות מועדפות עדיין</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Heart className="h-5 w-5 text-red-500" />
                                    מנות מועדפות
                                </CardTitle>
                                <CardDescription>
                                    המנות שהלקוח הזמין הכי הרבה פעמים
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>מנה</TableHead>
                                            <TableHead>מספר הזמנות</TableHead>
                                            <TableHead>כמות כוללת</TableHead>
                                            <TableHead>סה&quot;כ הוצאות</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {favoriteDishes.map((dish) => (
                                            <TableRow key={dish.dishId}>
                                                <TableCell className="font-medium">
                                                    {dish.dishName}
                                                </TableCell>
                                                <TableCell>{dish.orderCount}</TableCell>
                                                <TableCell>{dish.totalQuantity}</TableCell>
                                                <TableCell>₪{dish.totalRevenue.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
