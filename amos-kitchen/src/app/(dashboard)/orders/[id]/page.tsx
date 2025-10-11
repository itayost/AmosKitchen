// app/(dashboard)/orders/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import {
    ArrowRight,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Edit,
    Trash2,
    Printer,
    Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useToast } from '@/lib/hooks/use-toast'
import type { Order, OrderItem, Customer, OrderHistory } from '@/lib/types/database'

interface OrderDetails extends Order {
    customer: Customer
    orderItems: (OrderItem & {
        dish: {
            id: string
            name: string
            price: number
            category: string
        }
    })[]
    history?: OrderHistory[]
}

export default function OrderDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const orderId = params.id as string

    const [order, setOrder] = useState<OrderDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        fetchOrderDetails()
    }, [orderId])

    const fetchOrderDetails = async () => {
        try {
            const response = await fetchWithAuth(`/api/orders/${orderId}`)
            if (!response.ok) throw new Error('Failed to fetch order')

            const data = await response.json()
            setOrder(data)
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לטעון את פרטי ההזמנה',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (newStatus: string) => {
        if (!order) return

        setUpdating(true)
        try {
            console.log(`Updating order ${orderId} status to ${newStatus}`)

            const response = await fetchWithAuth(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
                console.error('API error response:', errorData)
                throw new Error(errorData.message || `Server error: ${response.status}`)
            }

            const responseData = await response.json()
            console.log('Status update response:', responseData)

            await fetchOrderDetails()
            toast({
                title: 'סטטוס עודכן',
                description: 'סטטוס ההזמנה עודכן בהצלחה'
            })
        } catch (error) {
            console.error('Status update error:', error)
            toast({
                title: 'שגיאה',
                description: error instanceof Error ? error.message : 'לא ניתן לעדכן את סטטוס ההזמנה',
                variant: 'destructive'
            })
        } finally {
            setUpdating(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('האם אתה בטוח שברצונך למחוק הזמנה זו?')) return

        try {
            const response = await fetchWithAuth(`/api/orders/${orderId}`, {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Failed to delete order')

            toast({
                title: 'ההזמנה נמחקה',
                description: 'ההזמנה נמחקה בהצלחה'
            })

            router.push('/orders')
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: 'לא ניתן למחוק את ההזמנה',
                variant: 'destructive'
            })
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const getStatusColor = (status: string) => {
        const colors = {
            'new': 'bg-blue-100 text-blue-800',
            'confirmed': 'bg-green-100 text-green-800',
            'preparing': 'bg-yellow-100 text-yellow-800',
            'ready': 'bg-purple-100 text-purple-800',
            'delivered': 'bg-gray-100 text-gray-800',
            'cancelled': 'bg-red-100 text-red-800'
        }
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    }

    const getStatusLabel = (status: string) => {
        const labels = {
            'new': 'חדשה',
            'confirmed': 'אושרה',
            'preparing': 'בהכנה',
            'ready': 'מוכנה',
            'delivered': 'נמסרה',
            'cancelled': 'בוטלה'
        }
        return labels[status as keyof typeof labels] || status
    }

    if (loading) return <LoadingSpinner />
    if (!order) return <div>הזמנה לא נמצאה</div>

    const total = order.orderItems.reduce((sum, item) =>
        sum + (Number(item.price) * item.quantity), 0
    )

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
                        <h1 className="text-3xl font-bold">הזמנה מס׳ {order.orderNumber}</h1>
                        <p className="text-muted-foreground">
                            נוצרה ב-{format(new Date(order.createdAt), 'dd/MM/yyyy בשעה HH:mm', { locale: he })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="ml-2 h-4 w-4" />
                        הדפס
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/orders/${orderId}/edit`)}
                    >
                        <Edit className="ml-2 h-4 w-4" />
                        ערוך
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDelete}
                        className="text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="ml-2 h-4 w-4" />
                        מחק
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>פריטי הזמנה</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>מנה</TableHead>
                                        <TableHead>קטגוריה</TableHead>
                                        <TableHead className="text-center">כמות</TableHead>
                                        <TableHead className="text-left">מחיר ליחידה</TableHead>
                                        <TableHead className="text-left">סה&quot;כ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.orderItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.dish.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{item.dish.category}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">{item.quantity}</TableCell>
                                            <TableCell className="text-left">₪{Number(item.price).toFixed(2)}</TableCell>
                                            <TableCell className="text-left font-medium">
                                                ₪{(Number(item.price) * item.quantity).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-left font-bold">סה&quot;כ לתשלום</TableCell>
                                        <TableCell className="text-left font-bold text-lg">
                                            ₪{total.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Order History */}
                    {order.history && order.history.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>היסטוריית הזמנה</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {order.history.map((event, index) => (
                                        <div key={event.id} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted'}`} />
                                                {index < order.history!.length - 1 && (
                                                    <div className="w-px h-full bg-muted" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <p className="font-medium">{event.action}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(new Date(event.createdAt), 'dd/MM/yyyy בשעה HH:mm', { locale: he })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>פרטי לקוח</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">שם</p>
                                <p className="font-medium">{order.customer.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">טלפון</p>
                                <a href={`tel:${order.customer.phone}`} className="font-medium text-primary">
                                    {order.customer.phone}
                                </a>
                            </div>
                            {order.customer.email && (
                                <div>
                                    <p className="text-sm text-muted-foreground">אימייל</p>
                                    <a href={`mailto:${order.customer.email}`} className="font-medium text-primary">
                                        {order.customer.email}
                                    </a>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-muted-foreground">כתובת למשלוח</p>
                                <p className="font-medium">{order.deliveryAddress || order.customer.address || 'לא צוינה'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>פרטי הזמנה</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">סטטוס</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge className={getStatusColor(order.status)}>
                                        {getStatusLabel(order.status)}
                                    </Badge>
                                    <Select
                                        value={order.status}
                                        onValueChange={handleStatusUpdate}
                                        disabled={updating}
                                    >
                                        <SelectTrigger className="w-[120px] h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="new">חדשה</SelectItem>
                                            <SelectItem value="confirmed">אושרה</SelectItem>
                                            <SelectItem value="preparing">בהכנה</SelectItem>
                                            <SelectItem value="ready">מוכנה</SelectItem>
                                            <SelectItem value="delivered">נמסרה</SelectItem>
                                            <SelectItem value="cancelled">בוטלה</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">תאריך משלוח</p>
                                <p className="font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {format(new Date(order.deliveryDate), 'EEEE, dd בMMMM yyyy', { locale: he })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">תאריך יצירה</p>
                                <p className="font-medium flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    {format(new Date(order.createdAt), 'dd/MM/yyyy בשעה HH:mm', { locale: he })}
                                </p>
                            </div>
                            {order.notes && (
                                <div>
                                    <p className="text-sm text-muted-foreground">הערות</p>
                                    <p className="font-medium bg-muted p-3 rounded-md mt-1">
                                        {order.notes}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
