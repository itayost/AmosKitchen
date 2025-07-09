// src/components/orders/order-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/lib/hooks/use-toast'
import type { Customer, Dish } from '@/lib/types/database'

// Form validation schema
const orderFormSchema = z.object({
    customerId: z.string().min(1, 'יש לבחור לקוח'),
    deliveryDate: z.date({
        required_error: "יש לבחור תאריך משלוח",
    }),
    deliveryAddress: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
        dishId: z.string().min(1, 'יש לבחור מנה'),
        quantity: z.number().int().positive('כמות חייבת להיות גדולה מ-0'),
        notes: z.string().optional(),
    })).min(1, 'יש להוסיף לפחות מנה אחת להזמנה')
})

type OrderFormValues = z.infer<typeof orderFormSchema>

interface OrderFormProps {
    customers?: Customer[]
    dishes?: Dish[]
}

export function OrderForm({ customers = [], dishes = [] }: OrderFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [customerSearch, setCustomerSearch] = useState('')
    const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [orderTotal, setOrderTotal] = useState(0)

    const form = useForm<OrderFormValues>({
        resolver: zodResolver(orderFormSchema),
        defaultValues: {
            customerId: '',
            deliveryDate: undefined,
            deliveryAddress: '',
            notes: '',
            items: [{ dishId: '', quantity: 1, notes: '' }]
        }
    })

    const { watch, setValue } = form

    // Get the next N Fridays
    const getNextFridays = (count: number = 8) => {
        const fridays = []
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Start from today
        let current = new Date(today)

        while (fridays.length < count) {
            // If current day is Friday and it's in the future or today
            if (current.getDay() === 5 && current >= today) {
                fridays.push(new Date(current))
            }
            // Move to next day
            current.setDate(current.getDate() + 1)
        }

        return fridays
    }

    // Watch for changes in order items to calculate total
    const watchItems = watch('items')
    useEffect(() => {
        const total = watchItems.reduce((sum, item) => {
            const dish = dishes.find(d => d.id === item.dishId)
            return sum + (dish ? dish.price * item.quantity : 0)
        }, 0)
        setOrderTotal(total)
    }, [watchItems, dishes])

    // Filter customers based on search
    const filteredCustomers = customers.filter(customer => {
        if (!customerSearch) return true
        const searchLower = customerSearch.toLowerCase()
        return (
            customer.name?.toLowerCase().includes(searchLower) ||
            customer.phone?.includes(customerSearch) ||
            customer.email?.toLowerCase().includes(searchLower)
        )
    })

    // Add new item to order
    const addItem = () => {
        const currentItems = form.getValues('items')
        form.setValue('items', [...currentItems, { dishId: '', quantity: 1, notes: '' }])
    }

    // Remove item from order
    const removeItem = (index: number) => {
        const currentItems = form.getValues('items')
        if (currentItems.length > 1) {
            form.setValue('items', currentItems.filter((_, i) => i !== index))
        }
    }

    // Handle form submission
    const onSubmit = async (data: OrderFormValues) => {
        setIsLoading(true)
        try {
            // Prepare items with prices
            const itemsWithPrices = data.items.map(item => {
                const dish = dishes.find(d => d.id === item.dishId)
                return {
                    ...item,
                    price: dish?.price || 0
                }
            })

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    items: itemsWithPrices,
                    deliveryDate: data.deliveryDate.toISOString(),
                }),
            })

            if (!response.ok) {
                throw new Error('שגיאה ביצירת ההזמנה')
            }

            const order = await response.json()

            toast({
                title: "ההזמנה נוצרה בהצלחה",
                description: `הזמנה מספר ${order.orderNumber} נוצרה עבור ${selectedCustomer?.name}`,
            })

            router.push('/orders')
        } catch (error) {
            toast({
                title: "שגיאה",
                description: error instanceof Error ? error.message : "אירעה שגיאה ביצירת ההזמנה",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Warning if no customers */}
                {customers.length === 0 && (
                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="p-4">
                            <p className="text-sm text-yellow-800">
                                אין לקוחות במערכת. יש להוסיף לקוחות לפני יצירת הזמנה.
                            </p>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>פרטי הזמנה</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Customer Selection - Simple Dropdown */}
                        <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>לקוח</FormLabel>
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="חפש לקוח לפי שם או טלפון..."
                                            value={customerSearch}
                                            onChange={(e) => setCustomerSearch(e.target.value)}
                                            onFocus={() => setCustomerDropdownOpen(true)}
                                            className="w-full"
                                        />

                                        {/* Selected Customer Display */}
                                        {selectedCustomer && customerSearch === selectedCustomer.name && (
                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                                {selectedCustomer.phone}
                                            </div>
                                        )}

                                        {/* Dropdown */}
                                        {customerDropdownOpen && (
                                            <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto shadow-lg">
                                                <CardContent className="p-0">
                                                    {filteredCustomers.length === 0 ? (
                                                        <div className="p-4 text-center text-muted-foreground">
                                                            לא נמצאו לקוחות תואמים
                                                        </div>
                                                    ) : (
                                                        filteredCustomers.map((customer) => (
                                                            <div
                                                                key={customer.id}
                                                                className="p-3 hover:bg-accent cursor-pointer border-b last:border-0 transition-colors"
                                                                onClick={() => {
                                                                    field.onChange(customer.id)
                                                                    setSelectedCustomer(customer)
                                                                    setCustomerSearch(customer.name)
                                                                    if (customer.address) {
                                                                        form.setValue('deliveryAddress', customer.address)
                                                                    }
                                                                    setCustomerDropdownOpen(false)
                                                                }}
                                                            >
                                                                <div className="font-medium">{customer.name}</div>
                                                                <div className="text-sm text-muted-foreground">{customer.phone}</div>
                                                                {customer.address && (
                                                                    <div className="text-xs text-muted-foreground mt-1">{customer.address}</div>
                                                                )}
                                                            </div>
                                                        ))
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>

                                    {/* Click outside to close */}
                                    {customerDropdownOpen && (
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setCustomerDropdownOpen(false)}
                                        />
                                    )}

                                    <FormDescription>
                                        חפש לקוח לפי שם או מספר טלפון
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Delivery Date - Simple Friday Selector */}
                        <FormField
                            control={form.control}
                            name="deliveryDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>תאריך משלוח</FormLabel>
                                    <FormControl>
                                        <select
                                            value={field.value?.toISOString() || ''}
                                            onChange={(e) => {
                                                field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                                            }}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">בחר תאריך משלוח...</option>
                                            {getNextFridays(8).map((friday) => (
                                                <option key={friday.toISOString()} value={friday.toISOString()}>
                                                    {format(friday, 'EEEE, d בMMMM yyyy', { locale: he })}
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormDescription>
                                        משלוחים מתבצעים בימי שישי בלבד
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Delivery Address */}
                        <FormField
                            control={form.control}
                            name="deliveryAddress"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>כתובת למשלוח</FormLabel>
                                    <FormControl>
                                        <Input placeholder="רחוב, מספר בית, עיר" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        השאר ריק אם הכתובת זהה לכתובת הלקוח
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Order Notes */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>הערות להזמנה</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="הערות כלליות להזמנה..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>פריטי הזמנה</CardTitle>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addItem}
                        >
                            <Plus className="ml-2 h-4 w-4" />
                            הוסף מנה
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {form.watch('items').map((item, index) => (
                                <Card key={index}>
                                    <CardContent className="pt-4">
                                        <div className="grid gap-4">
                                            <div className="grid grid-cols-12 gap-4">
                                                {/* Dish Selection */}
                                                <div className="col-span-6">
                                                    <FormField
                                                        control={form.control}
                                                        name={`items.${index}.dishId`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>מנה</FormLabel>
                                                                <FormControl>
                                                                    <select
                                                                        {...field}
                                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >
                                                                        <option value="">בחר מנה...</option>
                                                                        {dishes
                                                                            .filter(dish => dish.isAvailable)
                                                                            .map((dish) => (
                                                                                <option key={dish.id} value={dish.id}>
                                                                                    {dish.name} - ₪{dish.price}
                                                                                </option>
                                                                            ))}
                                                                    </select>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                {/* Quantity */}
                                                <div className="col-span-2">
                                                    <FormField
                                                        control={form.control}
                                                        name={`items.${index}.quantity`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>כמות</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        {...field}
                                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                {/* Price Display */}
                                                <div className="col-span-3 flex items-end">
                                                    <div className="w-full">
                                                        <Label>מחיר</Label>
                                                        <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
                                                            ₪{(() => {
                                                                const dish = dishes.find(d => d.id === item.dishId)
                                                                return dish ? (dish.price * item.quantity).toFixed(2) : '0.00'
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Remove Button */}
                                                <div className="col-span-1 flex items-end">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeItem(index)}
                                                        disabled={form.watch('items').length === 1}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Item Notes */}
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.notes`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>הערות למנה</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="הערות מיוחדות למנה זו..."
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4">
                        <div className="text-lg font-semibold">
                            סה״כ להזמנה:
                        </div>
                        <div className="text-2xl font-bold">
                            ₪{orderTotal.toFixed(2)}
                        </div>
                    </CardFooter>
                </Card>

                {/* Form Actions */}
                <div className="flex gap-4 justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/orders')}
                        disabled={isLoading}
                    >
                        ביטול
                    </Button>
                    <Button type="submit" disabled={isLoading || customers.length === 0}>
                        {isLoading ? 'יוצר הזמנה...' : 'צור הזמנה'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
