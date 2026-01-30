// app/(dashboard)/orders/[id]/edit/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import { FormPageLayout, FormSection, FormActions } from '@/components/forms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/lib/hooks/use-toast'
import type { Order, Customer, Dish } from '@/lib/types/database'

interface UpdateOrderInput {
    status?: string
    notes?: string
    deliveryAddress?: string
    items?: {
        id?: string
        dishId: string
        quantity: number
        price: number
        notes?: string
    }[]
}

type OrderItemInput = {
    id?: string
    dishId: string
    quantity: number
    price: number
    notes?: string
}

export default function EditOrderPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const orderId = params.id as string

    const [order, setOrder] = useState<Order | null>(null)
    const [customer, setCustomer] = useState<Customer | null>(null)
    const [availableDishes, setAvailableDishes] = useState<Dish[]>([])
    const [items, setItems] = useState<UpdateOrderInput['items']>([])
    const [status, setStatus] = useState<string>('')
    const [notes, setNotes] = useState<string>('')
    const [deliveryAddress, setDeliveryAddress] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const [orderResponse, dishesResponse] = await Promise.all([
                fetchWithAuth(`/api/orders/${orderId}`),
                fetchWithAuth('/api/dishes?available=true')
            ])

            if (!orderResponse.ok) throw new Error('Failed to fetch order')
            if (!dishesResponse.ok) throw new Error('Failed to fetch dishes')

            const orderData = await orderResponse.json()
            const dishesData = await dishesResponse.json()

            setOrder(orderData)
            setCustomer(orderData.customer)
            setAvailableDishes(dishesData)
            setItems(orderData.orderItems.map((item: any) => ({
                id: item.id,
                dishId: item.dishId,
                quantity: item.quantity,
                price: item.price,
                notes: item.notes || undefined,
            })))
            setStatus(orderData.status)
            setNotes(orderData.notes || '')
            setDeliveryAddress(orderData.deliveryAddress || orderData.customer.address || '')
        } catch (err) {
            setError('נכשל בטעינת ההזמנה')
            toast({
                title: 'שגיאה',
                description: 'נכשל בטעינת ההזמנה',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }, [orderId, toast])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleUpdateItem = (index: number, updates: Partial<OrderItemInput>) => {
        if (!items) return
        const newItems = [...items]
        newItems[index] = { ...newItems[index], ...updates }
        setItems(newItems)
    }

    const handleRemoveItem = (index: number) => {
        if (!items) return
        const newItems = items.filter((_, i) => i !== index)
        setItems(newItems)
    }

    const handleAddItem = () => {
        if (availableDishes.length === 0) return

        const dish = availableDishes[0]
        setItems([
            ...(items || []),
            {
                dishId: dish.id,
                quantity: 1,
                price: dish.price,
                notes: '',
            },
        ])
    }

    const handleSave = async () => {
        if (!items || items.length === 0) {
            toast({
                title: 'שגיאה',
                description: 'ההזמנה חייבת להכיל לפחות פריט אחד',
                variant: 'destructive',
            })
            return
        }

        setSaving(true)
        try {
            const requestBody: UpdateOrderInput = {
                status,
                notes: notes || undefined,
                deliveryAddress: deliveryAddress || undefined,
                items: items
            }

            const response = await fetchWithAuth(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            })

            if (!response.ok) throw new Error('Failed to update order')

            const updatedOrder: Order = await response.json()
            setOrder(updatedOrder)

            toast({
                title: 'ההזמנה עודכנה',
                description: 'ההזמנה עודכנה בהצלחה',
            })

            router.push(`/orders/${orderId}`)
        } catch (err) {
            toast({
                title: 'שגיאה',
                description: 'נכשל בעדכון ההזמנה',
                variant: 'destructive',
            })
        } finally {
            setSaving(false)
        }
    }

    const calculateTotal = () => {
        if (!items) return 0
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    }

    // Content to render when data is loaded
    const renderContent = () => {
        if (!order || !customer) {
            return (
                <div className="text-center py-12">
                    <h2 className="text-2xl font-semibold">הזמנה לא נמצאה</h2>
                    <Button onClick={() => router.push('/orders')} className="mt-4">
                        חזור להזמנות
                    </Button>
                </div>
            )
        }

        return (
            <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>פריטי הזמנה</CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddItem}
                                    disabled={availableDishes.length === 0 || saving}
                                >
                                    <Plus className="h-4 w-4 ml-2" />
                                    הוסף פריט
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {items && items.length > 0 ? (
                                    items.map((item, index) => (
                                        <div key={index} className="flex gap-4 p-4 border rounded-lg">
                                            <div className="flex-1 space-y-4">
                                                <div className="space-y-2">
                                                    <Label>מנה</Label>
                                                    <Select
                                                        value={item.dishId}
                                                        onValueChange={(value) => {
                                                            const dish = availableDishes.find(d => d.id === value)
                                                            if (dish) {
                                                                handleUpdateItem(index, {
                                                                    dishId: value,
                                                                    price: dish.price
                                                                })
                                                            }
                                                        }}
                                                        disabled={saving}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableDishes.map(dish => (
                                                                <SelectItem key={dish.id} value={dish.id}>
                                                                    {dish.name} - ₪{dish.price}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>כמות</Label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => handleUpdateItem(index, {
                                                                quantity: parseInt(e.target.value) || 1
                                                            })}
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>מחיר ליחידה</Label>
                                                        <Input
                                                            type="number"
                                                            value={item.price}
                                                            onChange={(e) => handleUpdateItem(index, {
                                                                price: parseFloat(e.target.value) || 0
                                                            })}
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>הערות</Label>
                                                    <Input
                                                        value={item.notes || ''}
                                                        onChange={(e) => handleUpdateItem(index, {
                                                            notes: e.target.value
                                                        })}
                                                        placeholder="הערות למנה"
                                                        disabled={saving}
                                                    />
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveItem(index)}
                                                disabled={items.length === 1 || saving}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center py-8 text-muted-foreground">
                                        אין פריטים בהזמנה
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        <FormSection title="הערות">
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="הערות להזמנה..."
                                rows={4}
                                disabled={saving}
                            />
                        </FormSection>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Customer Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>פרטי לקוח</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div>
                                    <Label className="text-muted-foreground">שם</Label>
                                    <p className="font-medium">{customer.name}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">טלפון</Label>
                                    <p className="font-medium">{customer.phone}</p>
                                </div>
                                {customer.email && (
                                    <div>
                                        <Label className="text-muted-foreground">אימייל</Label>
                                        <p className="font-medium">{customer.email}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Order Status & Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>סיכום הזמנה</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>סטטוס</Label>
                                    <Select value={status} onValueChange={setStatus} disabled={saving}>
                                        <SelectTrigger>
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

                                <div className="space-y-2">
                                    <Label>כתובת משלוח</Label>
                                    <Input
                                        value={deliveryAddress}
                                        onChange={(e) => setDeliveryAddress(e.target.value)}
                                        placeholder="כתובת למשלוח"
                                        disabled={saving}
                                    />
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex justify-between text-lg font-semibold">
                                        <span>סה&quot;כ לתשלום</span>
                                        <span>₪{calculateTotal().toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <FormActions
                    onCancel={() => router.push(`/orders/${orderId}`)}
                    onSubmit={handleSave}
                    submitLabel="שמור שינויים"
                    isSubmitting={saving}
                />
            </>
        )
    }

    return (
        <FormPageLayout
            breadcrumbs={[
                { label: 'לוח בקרה', href: '/dashboard' },
                { label: 'הזמנות', href: '/orders' },
                { label: order ? `#${order.orderNumber}` : 'הזמנה', href: `/orders/${orderId}` },
                { label: 'עריכה' }
            ]}
            title={`עריכת הזמנה ${order ? `#${order.orderNumber}` : ''}`}
            description={customer?.name}
            isLoading={loading}
            loadingSkeletonConfig={{ sections: 2, fieldsPerSection: [4, 3] }}
            error={error}
            onRetry={fetchData}
        >
            {renderContent()}
        </FormPageLayout>
    )
}
