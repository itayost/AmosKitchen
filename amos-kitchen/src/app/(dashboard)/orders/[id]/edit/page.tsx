// app/(dashboard)/orders/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api/fetch-with-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useToast } from '@/lib/hooks/use-toast';
import type { Order, Customer, Dish } from '@/lib/types/database';

interface UpdateOrderInput {
    status?: string;
    notes?: string;
    deliveryAddress?: string;
    items?: {
        id?: string;
        dishId: string;
        quantity: number;
        price: number;
        notes?: string;
    }[];
}

type OrderItemInput = {
    id?: string;
    dishId: string;
    quantity: number;
    price: number;
    notes?: string;
}

export default function EditOrderPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();

    const [order, setOrder] = useState<Order | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [availableDishes, setAvailableDishes] = useState<Dish[]>([]);
    const [items, setItems] = useState<UpdateOrderInput['items']>([]);
    const [status, setStatus] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [deliveryAddress, setDeliveryAddress] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([fetchOrder(), fetchDishes()]);
    }, [params.id]);

    const fetchOrder = async () => {
        try {
            const response = await fetchWithAuth(`/api/orders/${params.id}`);
            if (!response.ok) throw new Error('Failed to fetch order');
            const data = await response.json();

            setOrder(data);
            setCustomer(data.customer);
            setItems(data.orderItems.map((item: any) => ({
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
            const response = await fetchWithAuth('/api/dishes?available=true');
            if (!response.ok) throw new Error('Failed to fetch dishes');
            const data = await response.json();
            setAvailableDishes(data);
        } catch (error) {
            console.error('Error fetching dishes:', error);
        }
    };

    const handleUpdateItem = (index: number, updates: Partial<OrderItemInput>) => {
        if (!items) return;
        const newItems = [...items];
        newItems[index] = { ...newItems[index], ...updates };
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        if (!items) return;
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleAddItem = () => {
        if (availableDishes.length === 0) return;

        const dish = availableDishes[0];
        setItems([
            ...(items || []),
            {
                dishId: dish.id,
                quantity: 1,
                price: dish.price,
                notes: '',
            },
        ]);
    };

    const handleSave = async () => {
        if (!items || items.length === 0) {
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

            const response = await fetchWithAuth(`/api/orders/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) throw new Error('Failed to update order');

            const updatedOrder: Order = await response.json();
            setOrder(updatedOrder);

            toast({
                title: 'ההזמנה עודכנה',
                description: 'ההזמנה עודכנה בהצלחה',
            });

            router.push(`/orders/${params.id}`);
        } catch (error) {
            console.error('Error saving order:', error);
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
        if (!items) return 0;
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!order || !customer) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold">הזמנה לא נמצאה</h2>
                <Button onClick={() => router.push('/orders')} className="mt-4">
                    חזור להזמנות
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/orders/${params.id}`)}
                    >
                        <ArrowRight className="h-4 w-4 ml-2" />
                        חזור להזמנה
                    </Button>
                    <h1 className="text-3xl font-bold">עריכת הזמנה #{order.orderNumber}</h1>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4 ml-2" />
                    שמור שינויים
                </Button>
            </div>

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
                                disabled={availableDishes.length === 0}
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
                                            <div>
                                                <Label>מנה</Label>
                                                <Select
                                                    value={item.dishId}
                                                    onValueChange={(value) => {
                                                        const dish = availableDishes.find(d => d.id === value);
                                                        if (dish) {
                                                            handleUpdateItem(index, {
                                                                dishId: value,
                                                                price: dish.price
                                                            });
                                                        }
                                                    }}
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
                                                <div>
                                                    <Label>כמות</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleUpdateItem(index, {
                                                            quantity: parseInt(e.target.value) || 1
                                                        })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>מחיר ליחידה</Label>
                                                    <Input
                                                        type="number"
                                                        value={item.price}
                                                        onChange={(e) => handleUpdateItem(index, {
                                                            price: parseFloat(e.target.value) || 0
                                                        })}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <Label>הערות</Label>
                                                <Input
                                                    value={item.notes || ''}
                                                    onChange={(e) => handleUpdateItem(index, {
                                                        notes: e.target.value
                                                    })}
                                                    placeholder="הערות למנה"
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveItem(index)}
                                            disabled={items.length === 1}
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
                    <Card>
                        <CardHeader>
                            <CardTitle>הערות</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="הערות להזמנה..."
                                rows={4}
                            />
                        </CardContent>
                    </Card>
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
                                <Label>שם</Label>
                                <p className="font-medium">{customer.name}</p>
                            </div>
                            <div>
                                <Label>טלפון</Label>
                                <p className="font-medium">{customer.phone}</p>
                            </div>
                            {customer.email && (
                                <div>
                                    <Label>אימייל</Label>
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
                            <div>
                                <Label>סטטוס</Label>
                                <Select value={status} onValueChange={setStatus}>
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

                            <div>
                                <Label>כתובת משלוח</Label>
                                <Input
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                    placeholder="כתובת למשלוח"
                                />
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex justify-between text-lg font-semibold">
                                    {/* Fixed: Escaped the quote character */}
                                    <span>סה&quot;כ לתשלום</span>
                                    <span>₪{calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
