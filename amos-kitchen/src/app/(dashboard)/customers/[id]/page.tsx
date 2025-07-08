// app/(dashboard)/customers/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
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

    useEffect(() => {
        fetchCustomerDetails()
    }, [customerId])

    const fetchCustomerDetails = async () => {
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
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS'
        }).format(amount)
    }

    const getCustomerStatus = () => {
        if (!customer || customer.orders.length === 0) {
            return { label: 'לקוח חדש', variant: 'default' as const }
        }

        const lastOrderDate = customer.orders[0].createdAt // Orders are sorted by date desc
        const daysSinceLastOrder = Math.floor(
            (new Date().getTime() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysSinceLastOrder < 30) {
            return { label: 'לקוח פעיל', variant: 'success' as const }
        } else if (daysSinceLastOrder < 90) {
            return { label: 'לקוח לא פעיל', variant: 'warning' as const }
        } else {
            return { label: 'לקוח רדום', variant: 'secondary' as const }
        }
    }

    const calculateStatistics = () => {
        if (!customer) return {
            totalOrders: 0,
            totalSpent: 0,
            avgOrderValue: 0,
            favoriteDishes: [] as DishStats[]
        }

        const dishMap = new Map<string, DishStats>()
        let totalSpent = 0

        customer.orders.forEach(order => {
            totalSpent += Number(order.totalAmount)

            order.orderItems.forEach(item => {
                const existing = dishMap.get(item.dishId) || {
                    dishId: item.dishId,
                    dishName: item.dish.name,
                    orderCount: 0,
                    totalQuantity: 0,
                    totalRevenue: 0
                }

                dishMap.set(item.dishId, {
                    ...existing,
                    orderCount: existing.orderCount + 1,
                    totalQuantity: existing.totalQuantity + item.quantity,
                    totalRevenue: existing.totalRevenue + (Number(item.price) * item.quantity)
                })
            })
        })

        const favoriteDishes = Array.from(dishMap.values())
            .sort((a, b) => b.orderCount - a.orderCount)
            .slice(0, 5)

        return {
            totalOrders: customer.orders.length,
            totalSpent,
            avgOrderValue: customer.orders.length > 0 ? totalSpent / customer.orders.length : 0,
            favoriteDishes
        }
    }

    const handleEdit = () => {
        router.push(`/customers/${customerId}/edit`)
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        )
    }

    if (error || !customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h2 className="text-2xl font-semibold">שגיאה בטעינת פרטי לקוח</h2>
                <p className="text-muted-foreground">{error || 'הלקוח לא נמצא'}</p>
                <Button onClick={() => router.push('/customers')}>
                    חזרה לרשימת לקוחות
                </Button>
            </div>
        )
    }

    const status = getCustomerStatus()
    const stats = calculateStatistics()

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
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={status.variant}>{status.label}</Badge>
                            <span className="text-sm text-muted-foreground">
                                לקוח מתאריך {format(new Date(customer.createdAt), 'dd/MM/yyyy')}
                            </span>
                        </div>
                    </div>
                </div>
                <Button onClick={handleEdit}>
                    <Edit className="h-4 w-4 ml-2" />
                    עריכת פרטים
                </Button>
            </div>

            {/* Customer Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle>פרטי לקוח</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">טלפון</p>
                                    <p className="font-medium">{customer.phone}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">אימייל</p>
                                    <p className="font-medium">{customer.email || 'לא צוין'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-sm text-muted-foreground">כתובת</p>
                                    <p className="font-medium">{customer.address || 'לא צוינה'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-sm text-muted-foreground">הערות והעדפות</p>
                                    <p className="font-medium whitespace-pre-wrap">
                                        {customer.notes || 'אין הערות מיוחדות'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">סה"כ הזמנות</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">סה"כ הוצאות</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ממוצע הזמנה</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.avgOrderValue)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">הזמנה אחרונה</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {customer.orders.length > 0
                                ? format(new Date(customer.orders[0].createdAt), 'dd/MM', { locale: he })
                                : 'אין'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="orders" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="orders">היסטוריית הזמנות</TabsTrigger>
                    <TabsTrigger value="favorites">מנות מועדפות</TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>היסטוריית הזמנות</CardTitle>
                            <CardDescription>
                                כל ההזמנות של הלקוח, ממוינות לפי תאריך
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {customer.orders.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    אין הזמנות קודמות
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {customer.orders.map((order) => (
                                        <Card key={order.id} className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold">הזמנה #{order.orderNumber}</h4>
                                                        <Badge variant={
                                                            order.status === 'DELIVERED' ? 'success' :
                                                                order.status === 'CANCELLED' ? 'destructive' :
                                                                    'default'
                                                        }>
                                                            {order.status === 'NEW' && 'חדשה'}
                                                            {order.status === 'CONFIRMED' && 'אושרה'}
                                                            {order.status === 'PREPARING' && 'בהכנה'}
                                                            {order.status === 'READY' && 'מוכנה'}
                                                            {order.status === 'DELIVERED' && 'נמסרה'}
                                                            {order.status === 'CANCELLED' && 'בוטלה'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(new Date(order.orderDate), 'dd/MM/yyyy HH:mm')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">{formatCurrency(Number(order.totalAmount))}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        משלוח: {format(new Date(order.deliveryDate), 'dd/MM/yyyy')}
                                                    </p>
                                                </div>
                                            </div>

                                            <Separator className="my-3" />

                                            <div className="space-y-2">
                                                {order.orderItems.map((item) => (
                                                    <div key={item.id} className="flex justify-between text-sm">
                                                        <span>{item.dish.name} × {item.quantity}</span>
                                                        <span>{formatCurrency(Number(item.price) * item.quantity)}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {order.notes && (
                                                <>
                                                    <Separator className="my-3" />
                                                    <p className="text-sm text-muted-foreground">
                                                        <span className="font-medium">הערות:</span> {order.notes}
                                                    </p>
                                                </>
                                            )}

                                            <div className="mt-3 flex justify-end">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/orders/${order.id}`)}
                                                >
                                                    צפייה בהזמנה
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="favorites" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>מנות מועדפות</CardTitle>
                            <CardDescription>
                                המנות שהלקוח הזמין הכי הרבה פעמים
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {stats.favoriteDishes.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    אין מספיק נתונים להצגת מנות מועדפות
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>מנה</TableHead>
                                            <TableHead className="text-center">פעמים שהוזמנה</TableHead>
                                            <TableHead className="text-center">כמות כוללת</TableHead>
                                            <TableHead className="text-left">סה"כ הכנסות</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stats.favoriteDishes.map((dish) => (
                                            <TableRow key={dish.dishId}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Heart className="h-4 w-4 text-red-500" />
                                                        {dish.dishName}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">{dish.orderCount}</TableCell>
                                                <TableCell className="text-center">{dish.totalQuantity}</TableCell>
                                                <TableCell className="text-left">
                                                    {formatCurrency(dish.totalRevenue)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
