// app/(dashboard)/orders/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
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

const statusOptions = [
    { value: 'new', label: 'חדשה', color: 'bg-gray-500' },
    { value: 'confirmed', label: 'אושרה', color: 'bg-blue-500' },
    { value: 'preparing', label: 'בהכנה', color: 'bg-yellow-500' },
    { value: 'ready', label: 'מוכנה', color: 'bg-green-500' },
    { value: 'delivered', label: 'נמסרה', color: 'bg-purple-500' },
    { value: 'cancelled', label: 'בוטלה', color: 'bg-red-500' }
]

export default function OrderDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()

    const [order, setOrder] = useState<OrderDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        fetchOrder()
    }, [params.id])

    const fetchOrder = async () => {
        try {
            const response = await fetch(`/api/orders/${params.id}`)
            if (!response.ok) throw new Error('Failed to fetch order')

            const data = await response.json()
            setOrder(data)
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: 'נכשל בטעינת ההזמנה',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (newStatus: string) => {
        if (!order) return

        setUpdating(true)
        try {
            const response = await fetch(`/api/orders/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (!response.ok) throw new Error('Failed to update status')

            await fetchOrder()
            toast({
                title: 'סטטוס עודכן',
                description: 'סטטוס ההזמנה עודכן בהצלחה'
            })
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: 'נכשל בעדכון הסטטוס',
                variant: 'destructive'
            })
        } finally {
            setUpdating(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('האם אתה בטוח שברצונך למחוק הזמנה זו?')) return

        try {
            const response = await fetch(`/api/orders/${params.id}`, {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Failed to delete order')

            toast({
                title: 'הזמנה נמחקה',
                description: 'ההזמנה נמחקה בהצלחה'
            })

            router.push('/orders')
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: 'נכשל במחיקת ההזמנה',
                variant: 'destructive'
            })
        }
    }

    if (loading) {
        return <LoadingSpinner />
    }

    if (!order) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold">הזמנה לא נמצאה</h2>
                <Button onClick={() => router.push('/orders')} className="mt-4">
                    חזור להזמנות
                </Button>
            </div>
        )
    }

    const statusOption = statusOptions.find(s => s.value === order.status)
    const total = order.orderItems.reduce((sum, item) =>
        sum + (Number(item.price) * item.quantity), 0
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/orders')}
                    >
                        <ArrowRight className="h-4 w-4 ml-2" />
                        חזור להזמנות
                    </Button>
                    <h1 className="text-3xl font-bold">הזמנה #{order.orderNumber}</h1>
                    <Badge className={`${statusOption?.color} text-white`}>
                        {statusOption?.label}
                    </Badge>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/orders/${params.id}/edit`)}
                    >
                        <Edit className="h-4 w-4 ml-2" />
                        ערוך
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                    >
                        <Printer className="h-4 w-4 ml-2" />
                        הדפס
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                    >
                        <Trash2 className="h-4 w-4 ml-2" />
                        מחק
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                                        <TableHead className="text-left">סה"כ</TableHead>
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
                                        <TableCell colSpan={4} className="text-left font-bold">סה"כ לתשלום</TableCell>
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
                                                <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-gray-300'
                                                    }`} />
                                                {index < order.history!.length - 1 && (
                                                    <div className="w-0.5 h-16 bg-gray-300" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-8">
                                                <p className="font-medium">{event.action}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(new Date(event.createdAt), 'dd/MM/yyyy HH:mm')}
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
                                <h3 className="font-semibold text-lg">{order.customer.name}</h3>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span dir="ltr">{order.customer.phone}</span>
                                </div>

                                {order.customer.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{order.customer.email}</span>
                                    </div>
                                )}

                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <span>{order.deliveryAddress || order.customer.address}</span>
                                </div>
                            </div>

                            <Separator />

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push(`/customers/${order.customer.id}`)}
                            >
                                צפה בפרטי לקוח
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Order Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>פרטי הזמנה</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">תאריך הזמנה</span>
                                    <span>{format(new Date(order.createdAt), 'dd/MM/yyyy')}</span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">תאריך משלוח</span>
                                    <span className="font-medium">
                                        {format(new Date(order.deliveryDate), 'EEEE, dd/MM/yyyy', { locale: he })}
                                    </span>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">עדכון סטטוס</label>
                                    <Select
                                        value={order.status}
                                        onValueChange={handleStatusChange}
                                        disabled={updating}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {order.notes && (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">הערות</h4>
                                        <p className="text-sm text-muted-foreground">{order.notes}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
