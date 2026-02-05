// app/(dashboard)/orders/[id]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import {
    Calendar,
    Clock,
    Edit,
    Trash2,
    Printer,
    Copy,
    Truck,
    Store
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { DetailPageLayout } from '@/components/forms'
import { OrderTimeline } from '@/components/orders/order-timeline'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
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
    const [error, setError] = useState<string | null>(null)
    const [updating, setUpdating] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const fetchOrderDetails = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetchWithAuth(`/api/orders/${orderId}`)
            if (!response.ok) throw new Error('Failed to fetch order')

            const data = await response.json()
            setOrder(data)
        } catch (err) {
            setError('לא ניתן לטעון את פרטי ההזמנה')
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לטעון את פרטי ההזמנה',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }, [orderId, toast])

    useEffect(() => {
        fetchOrderDetails()
    }, [fetchOrderDetails])

    const handleStatusUpdate = async (newStatus: string) => {
        if (!order) return

        setUpdating(true)
        try {
            const response = await fetchWithAuth(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
                throw new Error(errorData.message || `Server error: ${response.status}`)
            }

            await fetchOrderDetails()
            toast({
                title: 'סטטוס עודכן',
                description: 'סטטוס ההזמנה עודכן בהצלחה'
            })
        } catch (err) {
            toast({
                title: 'שגיאה',
                description: err instanceof Error ? err.message : 'לא ניתן לעדכן את סטטוס ההזמנה',
                variant: 'destructive'
            })
        } finally {
            setUpdating(false)
        }
    }

    const handleDeleteConfirm = async () => {
        const response = await fetchWithAuth(`/api/orders/${orderId}`, {
            method: 'DELETE'
        })

        if (!response.ok) throw new Error('לא ניתן למחוק את ההזמנה')

        toast({
            title: 'ההזמנה נמחקה',
            description: 'ההזמנה נמחקה בהצלחה'
        })

        router.push('/orders')
    }

    const handlePrint = () => {
        window.print()
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'PREPARING': 'bg-yellow-100 text-yellow-800',
            'READY': 'bg-green-100 text-green-800',
            'DELIVERED': 'bg-gray-100 text-gray-800',
            'CANCELLED': 'bg-red-100 text-red-800'
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'PREPARING': 'בהכנה',
            'READY': 'מוכנה',
            'DELIVERED': 'נמסרה',
            'CANCELLED': 'בוטלה'
        }
        return labels[status] || status
    }

    const total = order?.orderItems.reduce((sum, item) =>
        sum + (Number(item.price) * item.quantity), 0
    ) || 0

    // Header actions
    const headerActions = (
        <div className="flex flex-wrap gap-2">
            <Button
                variant="default"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => router.push(`/orders/new?duplicate=${orderId}`)}
            >
                <Copy className="ml-2 h-4 w-4" />
                <span className="hidden sm:inline">הזמנה חוזרת</span>
                <span className="sm:hidden">שכפל</span>
            </Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={handlePrint}>
                <Printer className="ml-2 h-4 w-4" />
                <span className="hidden sm:inline">הדפס</span>
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => router.push(`/orders/${orderId}/edit`)}
            >
                <Edit className="ml-2 h-4 w-4" />
                <span className="hidden sm:inline">ערוך</span>
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="flex-1 sm:flex-none text-red-600 hover:text-red-700"
            >
                <Trash2 className="ml-2 h-4 w-4" />
                <span className="hidden sm:inline">מחק</span>
            </Button>
        </div>
    )

    // Status badge
    const statusBadge = order ? (
        <Badge className={getStatusColor(order.status)}>
            {getStatusLabel(order.status)}
        </Badge>
    ) : undefined

    return (
        <DetailPageLayout
            breadcrumbs={[
                { label: 'לוח בקרה', href: '/dashboard' },
                { label: 'הזמנות', href: '/orders' },
                { label: order ? `#${order.orderNumber}` : 'הזמנה' }
            ]}
            title={order ? `הזמנה מס׳ ${order.orderNumber}` : 'פרטי הזמנה'}
            description={order ? `נוצרה ב-${format(new Date(order.createdAt), 'dd/MM/yyyy בשעה HH:mm', { locale: he })}` : undefined}
            badge={statusBadge}
            headerActions={headerActions}
            isLoading={loading}
            loadingSkeletonConfig={{ showHeader: true, sections: 2, showSidebar: true }}
            error={error}
            onRetry={fetchOrderDetails}
        >
            {order && (
                <>
                    <div className="grid gap-6 lg:grid-cols-3 overflow-hidden">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6 min-w-0">
                            {/* Order Items */}
                            <Card className="overflow-hidden">
                                <CardHeader>
                                    <CardTitle>פריטי הזמנה</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
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
                                                    <TableCell colSpan={4} className="text-left text-muted-foreground">סכום ביניים</TableCell>
                                                    <TableCell className="text-left text-muted-foreground">
                                                        ₪{total.toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-left text-muted-foreground">
                                                        {(order.deliveryMethod || 'DELIVERY') === 'DELIVERY' ? 'דמי משלוח' : 'איסוף עצמי'}
                                                    </TableCell>
                                                    <TableCell className="text-left text-muted-foreground">
                                                        {(order.deliveryFee ?? 0) > 0 ? `₪${(order.deliveryFee ?? 0).toFixed(2)}` : 'חינם'}
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-left font-bold">סה&quot;כ לתשלום</TableCell>
                                                    <TableCell className="text-left font-bold text-lg">
                                                        ₪{order.totalAmount?.toFixed(2) || total.toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            </TableFooter>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Order Status Timeline */}
                            <Card className="overflow-hidden">
                                <CardHeader>
                                    <CardTitle>סטטוס הזמנה</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <OrderTimeline
                                        history={order.history || []}
                                        currentStatus={order.status}
                                        createdAt={order.createdAt}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6 min-w-0">
                            {/* Customer Info */}
                            <Card className="overflow-hidden">
                                <CardHeader>
                                    <CardTitle>פרטי לקוח</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">שם</p>
                                        <p className="font-medium break-words">{order.customer.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">טלפון</p>
                                        <a href={`tel:${order.customer.phone}`} className="font-medium text-primary break-all">
                                            {order.customer.phone}
                                        </a>
                                    </div>
                                    {order.customer.email && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">אימייל</p>
                                            <a href={`mailto:${order.customer.email}`} className="font-medium text-primary break-all">
                                                {order.customer.email}
                                            </a>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-muted-foreground">אופן קבלה</p>
                                        <p className="font-medium flex items-center gap-2">
                                            {(order.deliveryMethod || 'DELIVERY') === 'DELIVERY' ? (
                                                <>
                                                    <Truck className="h-4 w-4 flex-shrink-0" />
                                                    משלוח
                                                </>
                                            ) : (
                                                <>
                                                    <Store className="h-4 w-4 flex-shrink-0" />
                                                    איסוף עצמי
                                                </>
                                            )}
                                        </p>
                                    </div>
                                    {(order.deliveryMethod || 'DELIVERY') === 'DELIVERY' && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">כתובת למשלוח</p>
                                            <p className="font-medium break-words">{order.deliveryAddress || order.customer.address || 'לא צוינה'}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Order Details */}
                            <Card className="overflow-hidden">
                                <CardHeader>
                                    <CardTitle>פרטי הזמנה</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">סטטוס</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
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
                                        <p className="text-sm text-muted-foreground">
                                            {(order.deliveryMethod || 'DELIVERY') === 'DELIVERY' ? 'תאריך משלוח' : 'תאריך איסוף'}
                                        </p>
                                        <p className="font-medium flex flex-wrap items-center gap-2">
                                            <Calendar className="h-4 w-4 flex-shrink-0" />
                                            <span className="break-words">{format(new Date(order.deliveryDate), 'EEEE, dd בMMMM yyyy', { locale: he })}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">תאריך יצירה</p>
                                        <p className="font-medium flex flex-wrap items-center gap-2">
                                            <Clock className="h-4 w-4 flex-shrink-0" />
                                            <span className="break-words">{format(new Date(order.createdAt), 'dd/MM/yyyy בשעה HH:mm', { locale: he })}</span>
                                        </p>
                                    </div>
                                    {order.notes && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">הערות</p>
                                            <p className="font-medium bg-muted p-3 rounded-md mt-1 break-words whitespace-pre-wrap">
                                                {order.notes}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Delete Confirmation Dialog */}
                    <ConfirmDialog
                        open={deleteDialogOpen}
                        onOpenChange={setDeleteDialogOpen}
                        onConfirm={handleDeleteConfirm}
                        variant="danger"
                        title="מחיקת הזמנה"
                        description="האם אתה בטוח שברצונך למחוק הזמנה זו? פעולה זו לא ניתנת לביטול."
                        confirmLabel="מחק"
                        cancelLabel="ביטול"
                    />
                </>
            )}
        </DetailPageLayout>
    )
}
