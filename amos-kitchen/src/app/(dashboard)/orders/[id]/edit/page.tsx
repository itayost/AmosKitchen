// app/(dashboard)/orders/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Save, ArrowLeft, Clock, Package, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

// Import types from your existing types file
import type {
    Order,
    OrderItem,
    OrderHistory,
    OrderStatus,
    UpdateOrderInput,
    Dish
} from '@/lib/types/database';

const orderStatuses = [
    { value: 'new', label: 'חדש', color: 'bg-blue-500' },
    { value: 'confirmed', label: 'מאושר', color: 'bg-green-500' },
    { value: 'preparing', label: 'בהכנה', color: 'bg-yellow-500' },
    { value: 'ready', label: 'מוכן', color: 'bg-purple-500' },
    { value: 'delivered', label: 'נמסר', color: 'bg-gray-500' },
    { value: 'cancelled', label: 'בוטל', color: 'bg-red-500' },
];

export default function EditOrderPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { toast } = useToast();
    const [order, setOrder] = useState<Order | null>(null);
    const [items, setItems] = useState<UpdateOrderInput['items']>([]);
    const [status, setStatus] = useState<OrderStatus>('new');
    const [notes, setNotes] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [availableDishes, setAvailableDishes] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchOrder();
        fetchDishes();
    }, [params.id]);

    const fetchOrder = async () => {
        try {
            const response = await fetch(`/api/orders/${params.id}`);
            if (!response.ok) throw new Error('Failed to fetch order');
            const data: Order = await response.json();
            setOrder(data);
            // Transform orderItems to match UpdateOrderInput format
            setItems(data.orderItems.map(item => ({
                id: item.id,
                dishId: item.dishId,
                quantity: item.quantity,
                price: item.price,
                notes: item.notes || undefined,
            })));
            setStatus(data.status);
            setNotes(data.notes || '');
            setDeliveryAddress(data.deliveryAddress || data.customer.address || '');
        } catch (error) {
            console.error('Error fetching order:', error);
            toast({
                title: 'שגיאה',
                description: 'נכשל בטעינת ההזמנה',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchDishes = async () => {
        try {
            const response = await fetch('/api/dishes?available=true');
            if (!response.ok) throw new Error('Failed to fetch dishes');
            const data = await response.json();
            setAvailableDishes(data);
        } catch (error) {
            console.error('Error fetching dishes:', error);
        }
    };

    const handleUpdateItem = (index: number, updates: Partial<UpdateOrderInput['items'][0]>) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], ...updates };
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleAddItem = () => {
        if (availableDishes.length === 0) return;

        const dish = availableDishes[0];
        setItems([
            ...items,
            {
                dishId: dish.id,
                quantity: 1,
                price: dish.price,
                notes: '',
            },
        ]);
    };

    const handleSave = async () => {
        if (items.length === 0) {
            toast({
                title: 'שגיאה',
                description: 'ההזמנה חייבת להכיל לפחות פריט אחד',
                variant: 'destructive',
            });
            return;
        }

        setSaving(true);
        try {
            const requestBody: UpdateOrderInput = {
                status,
                notes: notes || undefined,
                deliveryAddress: deliveryAddress || undefined,
                items: items
            };

            const response = await fetch(`/api/orders/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) throw new Error('Failed to update order');

            const updatedOrder: Order = await response.json();
            setOrder(updatedOrder);
            // Transform back to UpdateOrderInput format
            setItems(updatedOrder.orderItems.map(item => ({
                id: item.id,
                dishId: item.dishId,
                quantity: item.quantity,
                price: item.price,
                notes: item.notes || undefined,
            })));

            toast({
                title: 'הצלחה',
                description: 'ההזמנה עודכנה בהצלחה',
            });

            // Redirect after short delay
            setTimeout(() => {
                router.push('/orders');
            }, 1500);
        } catch (error) {
            console.error('Error updating order:', error);
            toast({
                title: 'שגיאה',
                description: 'נכשל בעדכון ההזמנה',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const getActionDescription = (history: OrderHistory) => {
        const { action, details } = history;

        switch (action) {
            case 'status_change':
                return `סטטוס שונה מ-${details.fromLabel} ל-${details.toLabel}`;
            case 'item_added':
                return `נוסף: ${details.dishName} (${details.quantity} יח׳)`;
            case 'item_removed':
                return `הוסר: ${details.dishName} (${details.quantity} יח׳)`;
            case 'item_updated':
                return `עודכן: ${details.dishName} (${details.oldQuantity} → ${details.newQuantity} יח׳)`;
            case 'order_updated':
                const changes = [];
                if (details.deliveryDate) changes.push('תאריך משלוח');
                if (details.notes) changes.push('הערות');
                if (details.deliveryAddress) changes.push('כתובת');
                return `עודכנו: ${changes.join(', ')}`;
            default:
                return action;
        }
    };

    const getStatusBadge = (statusValue: OrderStatus) => {
        const statusConfig = orderStatuses.find(s => s.value === statusValue);
        if (!statusConfig) return null;

        return (
            <Badge className={`${statusConfig.color} text-white`}>
                {statusConfig.label}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center p-8">
                <p className="text-lg text-muted-foreground">ההזמנה לא נמצאה</p>
                <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => router.push('/orders')}
                >
                    חזור להזמנות
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">עריכת הזמנה #{order.orderNumber}</h1>
                    <p className="text-muted-foreground mt-1">
                        נוצרה ב-{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => router.push('/orders')}
                >
                    <ArrowLeft className="ml-2 h-4 w-4" />
                    חזור להזמנות
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                פרטי לקוח
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">שם</p>
                                    <p className="font-medium">{order.customer.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">טלפון</p>
                                    <p className="font-medium">{order.customer.phone}</p>
                                </div>
                                {order.customer.email && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">אימייל</p>
                                        <p className="font-medium">{order.customer.email}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-muted-foreground">תאריך משלוח</p>
                                    <p className="font-medium">
                                        {format(new Date(order.deliveryDate), 'dd/MM/yyyy')}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="deliveryAddress">כתובת למשלוח</Label>
                                <Textarea
                                    id="deliveryAddress"
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                    placeholder="הזן כתובת למשלוח..."
                                    rows={2}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Status & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>סטטוס הזמנה</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {orderStatuses.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${s.color}`} />
                                                    {s.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>הערות להזמנה</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="הערות כלליות להזמנה..."
                                    rows={3}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Items */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    פריטי הזמנה
                                </CardTitle>
                                <Button
                                    size="sm"
                                    onClick={handleAddItem}
                                    disabled={availableDishes.length === 0}
                                >
                                    <Plus className="ml-2 h-4 w-4" />
                                    הוסף פריט
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div key={index} className="border rounded-lg p-4 bg-muted/20">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="md:col-span-2">
                                                <Label>מנה</Label>
                                                <Select
                                                    value={item.dishId}
                                                    onValueChange={(value) => {
                                                        const dish = availableDishes.find(d => d.id === value);
                                                        handleUpdateItem(index, {
                                                            dishId: value,
                                                            price: dish?.price || 0,
                                                        });
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableDishes.map((dish) => (
                                                            <SelectItem key={dish.id} value={dish.id}>
                                                                {dish.name} - ₪{dish.price}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label>כמות</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleUpdateItem(index, {
                                                        quantity: parseInt(e.target.value) || 1,
                                                    })}
                                                />
                                            </div>

                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <Label>סה"כ</Label>
                                                    <p className="text-lg font-semibold">
                                                        ₪{(item.price * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    onClick={() => handleRemoveItem(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <Label>הערות לפריט</Label>
                                            <Input
                                                value={item.notes || ''}
                                                onChange={(e) => handleUpdateItem(index, {
                                                    notes: e.target.value,
                                                })}
                                                placeholder="הערות או בקשות מיוחדות..."
                                            />
                                        </div>
                                    </div>
                                ))}

                                {items.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>אין פריטים בהזמנה</p>
                                        <p className="text-sm">לחץ על "הוסף פריט" כדי להתחיל</p>
                                    </div>
                                )}
                            </div>

                            {items.length > 0 && (
                                <div className="mt-6 pt-4 border-t">
                                    <div className="flex justify-between items-center text-lg font-semibold">
                                        <span>סה"כ להזמנה:</span>
                                        <span className="text-2xl">₪{calculateTotal().toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/orders')}
                            disabled={saving}
                        >
                            ביטול
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving || items.length === 0}
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" />
                                    שומר...
                                </>
                            ) : (
                                <>
                                    <Save className="ml-2 h-4 w-4" />
                                    שמור שינויים
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Sidebar - History */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                היסטוריית שינויים
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                {order.history && order.history.length > 0 ? (
                                    order.history.map((entry) => (
                                        <div key={entry.id} className="border-b pb-3 last:border-0">
                                            <p className="text-sm font-medium">
                                                {getActionDescription(entry)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(entry.createdAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">אין היסטוריית שינויים</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
