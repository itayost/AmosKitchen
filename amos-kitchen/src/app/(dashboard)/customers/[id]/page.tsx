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
    AlertCircle,
    AlertTriangle,
    Utensils,
    Stethoscope,
    Plus
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
import { PreferenceBadge, CriticalPreferenceAlert } from '@/components/customers/preference-badge'
import { PREFERENCE_CONFIGS, groupPreferencesByType, getPreferenceSummary } from '@/lib/utils/preferences'
import type { Customer, Order, OrderItem, Dish, CustomerPreference } from '@/lib/types/database'

interface CustomerDetails extends Customer {
    orders: (Order & {
        orderItems: (OrderItem & {
            dish: Dish
        })[]
    })[]
    preferences?: CustomerPreference[]
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
            setError(err instanceof Error ? err.message : 'אירעה שגיאה')
        } finally {
            setLoading(false)
        }
    }, [customerId])

    useEffect(() => {
        fetchCustomerDetails()
    }, [fetchCustomerDetails])

    if (loading) return <LoadingSpinner />
    if (error) return <div className="text-center text-red-600">שגיאה: {error}</div>
    if (!customer) return <div className="text-center">לקוח לא נמצא</div>

    const orderCount = customer.orders.length
    const totalSpent = customer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
    const lastOrder = customer.orders[0]

    // Calculate favorite dishes
    const dishStats = new Map<string, DishStats>()
    customer.orders.forEach(order => {
        order.orderItems.forEach(item => {
            const existing = dishStats.get(item.dishId) || {
                dishId: item.dishId,
                dishName: item.dish.name,
                orderCount: 0,
                totalQuantity: 0,
                totalRevenue: 0
            }
            existing.orderCount++
            existing.totalQuantity += item.quantity
            existing.totalRevenue += item.quantity * Number(item.price)
            dishStats.set(item.dishId, existing)
        })
    })

    const favoriteDishes = Array.from(dishStats.values())
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 5)

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS'
        }).format(amount)
    }

    const groupedPreferences = customer.preferences ? groupPreferencesByType(customer.preferences) : null
    const hasCriticalPreferences = customer.preferences?.some(
        p => p.type === 'ALLERGY' || p.type === 'MEDICAL'
    ) || false

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
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold">{customer.name}</h1>
                            {hasCriticalPreferences && (
                                <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    הגבלות קריטיות
                                </Badge>
                            )}
                        </div>
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

            {/* Critical Preferences Alert */}
            {hasCriticalPreferences && customer.preferences && (
                <CriticalPreferenceAlert preferences={customer.preferences} />
            )}

            {/* Main Content Grid */}
            <div className="grid gap-6 md:grid-cols-2">
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
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">כתובת:</span>
                                <span>{customer.address}</span>
                            </div>
                        )}
                        {customer.notes && (
                            <div className="pt-3 border-t">
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">הערות:</span> {customer.notes}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Statistics Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>סטטיסטיקות</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <ShoppingCart className="h-4 w-4" />
                                    <span className="text-sm">הזמנות</span>
                                </div>
                                <p className="text-2xl font-bold">{orderCount}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <DollarSign className="h-4 w-4" />
                                    <span className="text-sm">סה&quot;כ הוצאות</span>
                                </div>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(totalSpent)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="text-sm">ממוצע להזמנה</span>
                                </div>
                                <p className="text-xl font-semibold">
                                    {orderCount > 0 ? formatCurrency(totalSpent / orderCount) : '-'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-sm">הזמנה אחרונה</span>
                                </div>
                                <p className="text-sm font-medium">
                                    {lastOrder
                                        ? format(new Date(lastOrder.createdAt), 'dd/MM/yyyy', { locale: he })
                                        : '-'
                                    }
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Preferences Section */}
            {customer.preferences && customer.preferences.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            העדפות והגבלות תזונתיות
                            <Badge>{customer.preferences.length}</Badge>
                        </CardTitle>
                        <CardDescription>
                            מידע חשוב על הגבלות תזונתיות, אלרגיות והעדפות אישיות
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {groupedPreferences && Object.entries(PREFERENCE_CONFIGS).map(([type, config]) => {
                                const preferences = groupedPreferences[type as keyof typeof groupedPreferences]
                                if (!preferences || preferences.length === 0) return null

                                const Icon = config.icon

                                return (
                                    <div key={type} className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Icon className="h-4 w-4" />
                                            <h4 className="font-semibold">{config.hebrewLabel}</h4>
                                        </div>
                                        <div className="grid gap-2 md:grid-cols-2">
                                            {preferences.map((pref) => (
                                                <div
                                                    key={pref.id}
                                                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                                                >
                                                    <PreferenceBadge
                                                        preference={pref}
                                                        showIcon={false}
                                                        className="mt-0.5"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="font-medium">{pref.value}</p>
                                                        {pref.notes && (
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {pref.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs Section */}
            <Tabs defaultValue="orders" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="orders">הזמנות ({orderCount})</TabsTrigger>
                    <TabsTrigger value="favorites">מנות מועדפות</TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="space-y-4">
                    {customer.orders.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-8">
                                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">אין הזמנות עדיין</p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => router.push('/orders/new')}
                                >
                                    <Plus className="h-4 w-4 ml-2" />
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
                                        <TableHead className="text-right">סכום</TableHead>
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
                                                <Badge variant={
                                                    order.status === 'delivered' ? 'default' :
                                                        order.status === 'cancelled' ? 'destructive' :
                                                            'secondary'
                                                }>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(Number(order.totalAmount))}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.push(`/orders/${order.id}`)}
                                                >
                                                    <FileText className="h-4 w-4" />
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
                    <Card>
                        <CardHeader>
                            <CardTitle>מנות מועדפות</CardTitle>
                            <CardDescription>
                                המנות שהלקוח הזמין הכי הרבה פעמים
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {favoriteDishes.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">
                                    אין מספיק נתונים להצגת מנות מועדפות
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {favoriteDishes.map((dish, index) => (
                                        <div
                                            key={dish.dishId}
                                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{dish.dishName}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        הוזמן {dish.orderCount} פעמים • {dish.totalQuantity} מנות
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-green-600">
                                                    {formatCurrency(dish.totalRevenue)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    סה&quot;כ הכנסות
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
