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
        const current = new Date(today)  // Changed from 'let' to 'const'

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

                {/* Customer Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>פרטי לקוח</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>בחר לקוח</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                placeholder="חפש לפי שם, טלפון או אימייל..."
                                                value={customerSearch}
                                                onChange={(e) => {
                                                    setCustomerSearch(e.target.value)
                                                    setCustomerDropdownOpen(true)
                                                }}
                                                onFocus={() => setCustomerDropdownOpen(true)}
                                            />
                                            {customerDropdownOpen && filteredCustomers.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                                    {filteredCustomers.map(customer => (
                                                        <div
                                                            key={customer.id}
                                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                            onClick={() => {
                                                                field.onChange(customer.id)
                                                                setSelectedCustomer(customer)
                                                                setCustomerSearch(customer.name)
                                                                setCustomerDropdownOpen(false)
                                                                if (customer.address) {
                                                                    form.setValue('deliveryAddress', customer.address)
                                                                }
                                                            }}
                                                        >
                                                            <div className="font-medium">{customer.name}</div>
                                                            <div className="text-sm text-gray-600">{customer.phone}</div>
                                                            {customer.address && (
                                                                <div className="text-sm text-gray-500">{customer.address}</div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="deliveryDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>תאריך משלוח (ימי שישי בלבד)</FormLabel>
                                    <FormControl>
                                        <select
                                            className="w-full h-10 px-3 rounded-md border"
                                            value={field.value ? field.value.toISOString() : ''}
                                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                        >
                                            <option value="">בחר תאריך משלוח</option>
                                            {getNextFridays().map(friday => (
                                                <option key={friday.toISOString()} value={friday.toISOString()}>
                                                    {format(friday, 'EEEE, dd בMMMM yyyy', { locale: he })}
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormDescription>
                                        המשלוחים מתבצעים בימי שישי בלבד
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="deliveryAddress"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>כתובת למשלוח</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="הכנס כתובת למשלוח" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                    <CardHeader>
                        <CardTitle>פרטי הזמנה</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {form.watch('items').map((item, index) => (
                            <Card key={index} className="p-4">
                                <div className="grid grid-cols-12 gap-4">
                                    {/* Dish Selection */}
                                    <div className="col-span-5">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.dishId`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>מנה</FormLabel>
                                                    <FormControl>
                                                        <select
                                                            className="w-full h-10 px-3 rounded-md border"
                                                            {...field}
                                                        >
                                                            <option value="">בחר מנה</option>
                                                            {dishes.filter(d => d.isAvailable).map(dish => (
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

                                    {/* Delete Button */}
                                    <div className="col-span-2 flex items-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => removeItem(index)}
                                            disabled={form.watch('items').length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Item Notes */}
                                <div className="mt-3">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.notes`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>הערות למנה</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="הערות מיוחדות למנה זו" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </Card>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={addItem}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 ml-2" />
                            הוסף מנה
                        </Button>
                    </CardContent>
                </Card>

                {/* Order Notes */}
                <Card>
                    <CardHeader>
                        <CardTitle>הערות להזמנה</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="הערות כלליות להזמנה..."
                                            rows={3}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Order Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>סיכום הזמנה</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-semibold">
                            סה&quot;כ להזמנה:
                        </div>
                        <div className="text-2xl font-bold">
                            ₪{orderTotal.toFixed(2)}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/orders')}
                        >
                            ביטול
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || customers.length === 0}
                        >
                            {isLoading ? 'שומר...' : 'צור הזמנה'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    )
}
