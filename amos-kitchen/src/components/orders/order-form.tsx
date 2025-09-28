// src/components/orders/order-form.tsx - Updated version with Friday-only selection and RTL fixes
'use client'

import { useState, useEffect } from 'react'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { Plus, Trash2, AlertTriangle, Info, User, Calendar as CalendarIcon } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/lib/hooks/use-toast'
import { CriticalPreferenceAlert, PreferenceBadgeGroup } from '@/components/customers/preference-badge'
import { CustomerPreferenceCard } from '@/components/customers/customer-preference-card'
import type { Customer, Dish, CustomerPreference } from '@/lib/types/database'

// Helper functions for Friday-only delivery
const getNextAvailableFriday = (): Date => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const currentDay = today.getDay()
    let daysUntilFriday = (5 - currentDay + 7) % 7

    // If today is Thursday after cutoff (6 PM), skip to next Friday
    if (currentDay === 4) { // Thursday
        const now = new Date()
        const cutoffTime = new Date(today)
        cutoffTime.setHours(18, 0, 0, 0) // 6 PM cutoff

        if (now >= cutoffTime) {
            daysUntilFriday = 8 // Next Friday (skip this week)
        } else {
            daysUntilFriday = 1 // Tomorrow (Friday)
        }
    }

    // If today is Friday, check if before delivery cutoff
    if (currentDay === 5) { // Friday
        const now = new Date()
        const cutoffTime = new Date(today)
        cutoffTime.setHours(12, 0, 0, 0) // Noon cutoff on Friday

        if (now >= cutoffTime) {
            daysUntilFriday = 7 // Next Friday
        } else {
            daysUntilFriday = 0 // Today
        }
    }

    // If it's Saturday or Sunday, calculate days to next Friday
    if (currentDay === 6 || currentDay === 0) {
        daysUntilFriday = currentDay === 6 ? 6 : 5
    }

    const nextFriday = new Date(today)
    nextFriday.setDate(today.getDate() + daysUntilFriday)
    return nextFriday
}

// Get all available Fridays for the next 4 weeks
const getAvailableFridays = (): Date[] => {
    const fridays: Date[] = []
    const firstFriday = getNextAvailableFriday()

    for (let i = 0; i < 4; i++) {
        const friday = new Date(firstFriday)
        friday.setDate(firstFriday.getDate() + (i * 7))
        fridays.push(friday)
    }

    return fridays
}

// Format date for Hebrew display
const formatDeliveryDate = (date: Date): string => {
    return format(date, 'EEEE, dd בMMMM yyyy', { locale: he })
}

// Form validation schema with Friday validation
const orderFormSchema = z.object({
    customerId: z.string().min(1, 'יש לבחור לקוח'),
    deliveryDate: z.date({
        required_error: "יש לבחור תאריך משלוח",
    }).refine((date) => {
        return date.getDay() === 5 // Must be Friday
    }, {
        message: "ניתן לבחור רק ימי שישי למשלוח"
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

interface CustomerWithPreferences extends Customer {
    preferences?: CustomerPreference[]
}

interface OrderFormProps {
    customers?: CustomerWithPreferences[]
    dishes?: Dish[]
}

export function OrderForm({ customers = [], dishes = [] }: OrderFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithPreferences | null>(null)
    const [customerSearch, setCustomerSearch] = useState('')
    const [orderTotal, setOrderTotal] = useState(0)
    const [showPreferenceDetails, setShowPreferenceDetails] = useState(false)

    const form = useForm<OrderFormValues>({
        resolver: zodResolver(orderFormSchema),
        defaultValues: {
            customerId: '',
            deliveryDate: getNextAvailableFriday(),
            deliveryAddress: '',
            notes: '',
            items: [{ dishId: '', quantity: 1, notes: '' }]
        }
    })

    const watchCustomerId = form.watch('customerId')
    const watchItems = form.watch('items')

    // Update selected customer when customerId changes
    useEffect(() => {
        const customer = customers.find(c => c.id === watchCustomerId)
        setSelectedCustomer(customer || null)

        // Auto-fill delivery address if available
        if (customer?.address) {
            form.setValue('deliveryAddress', customer.address)
        }

        // If customer has critical preferences, show details by default
        if (customer?.preferences?.some(p => p.type === 'ALLERGY' || p.type === 'MEDICAL')) {
            setShowPreferenceDetails(true)
        }
    }, [watchCustomerId, customers, form])

    // Calculate order total
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

    // Check if customer has critical preferences
    const hasCriticalPreferences = (customer: CustomerWithPreferences | null) => {
        if (!customer?.preferences) return false
        return customer.preferences.some(p => p.type === 'ALLERGY' || p.type === 'MEDICAL')
    }

    // Get preference summary for notes
    const getPreferenceSummaryForNotes = (preferences?: CustomerPreference[]) => {
        if (!preferences || preferences.length === 0) return ''

        const critical = preferences.filter(p => p.type === 'ALLERGY' || p.type === 'MEDICAL')
        if (critical.length === 0) return ''

        return `⚠️ שים לב: ${critical.map(p => `${p.type === 'ALLERGY' ? 'אלרגיה' : 'רפואי'} - ${p.value}`).join(', ')}`
    }

    // Add preference summary to notes when customer is selected
    useEffect(() => {
        if (selectedCustomer?.preferences) {
            const summary = getPreferenceSummaryForNotes(selectedCustomer.preferences)
            if (summary) {
                const currentNotes = form.getValues('notes') || ''
                if (!currentNotes.includes(summary)) {
                    form.setValue('notes', currentNotes ? `${summary}\n${currentNotes}` : summary)
                }
            }
        }
    }, [selectedCustomer, form])

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

            const response = await fetchWithAuth('/api/orders', {
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
                const error = await response.json()
                throw new Error(error.message || 'שגיאה ביצירת ההזמנה')
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
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

                {/* Customer Selection Card */}
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
                                    <FormLabel>בחר לקוח *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="בחר לקוח מהרשימה">
                                                    {field.value && selectedCustomer && (
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4" />
                                                            <span>{selectedCustomer.name}</span>
                                                            {hasCriticalPreferences(selectedCustomer) && (
                                                                <Badge variant="destructive" className="h-5 px-1">
                                                                    <AlertTriangle className="h-3 w-3" />
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}
                                                </SelectValue>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <div className="p-2">
                                                <Input
                                                    placeholder="חיפוש לקוח..."
                                                    value={customerSearch}
                                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                                    className="mb-2"
                                                />
                                            </div>
                                            {filteredCustomers.map((customer) => (
                                                <SelectItem key={customer.id} value={customer.id}>
                                                    <div className="flex items-center gap-2 w-full">
                                                        <span>{customer.name}</span>
                                                        {hasCriticalPreferences(customer) && (
                                                            <Badge variant="destructive" className="h-4 px-1 ml-auto">
                                                                !
                                                            </Badge>
                                                        )}
                                                        {customer.preferences && customer.preferences.length > 0 && (
                                                            <span className="text-xs text-muted-foreground">
                                                                ({customer.preferences.length} העדפות)
                                                            </span>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Customer Preferences Display */}
                        {selectedCustomer && selectedCustomer.preferences && selectedCustomer.preferences.length > 0 && (
                            <div className="space-y-3 animate-in slide-in-from-top-2">
                                {/* Critical Preferences Alert */}
                                {hasCriticalPreferences(selectedCustomer) && (
                                    <CriticalPreferenceAlert
                                        preferences={selectedCustomer.preferences}
                                        className="shadow-sm"
                                    />
                                )}

                                {/* All Preferences */}
                                <div className="border rounded-lg p-4 bg-muted/30">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold flex items-center gap-2">
                                            <Info className="h-4 w-4" />
                                            העדפות הלקוח
                                        </h4>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowPreferenceDetails(!showPreferenceDetails)}
                                        >
                                            {showPreferenceDetails ? 'הסתר' : 'הצג'} פרטים
                                        </Button>
                                    </div>

                                    {showPreferenceDetails ? (
                                        <CustomerPreferenceCard
                                            customer={selectedCustomer}
                                            variant="compact"
                                            showTitle={false}
                                        />
                                    ) : (
                                        <PreferenceBadgeGroup
                                            preferences={selectedCustomer.preferences}
                                            maxVisible={10}
                                            showIcon={true}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Customer Contact Info */}
                        {selectedCustomer && (
                            <div className="grid gap-2 text-sm text-muted-foreground">
                                <div>טלפון: {selectedCustomer.phone}</div>
                                {selectedCustomer.email && <div>אימייל: {selectedCustomer.email}</div>}
                                {selectedCustomer.address && <div>כתובת: {selectedCustomer.address}</div>}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Delivery Details Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>פרטי משלוח</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="deliveryDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>תאריך משלוח *</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(new Date(value))}
                                            value={field.value?.toISOString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="text-right">
                                                    <SelectValue placeholder="בחר יום שישי למשלוח">
                                                        {field.value && (
                                                            <div className="flex items-center gap-2">
                                                                <CalendarIcon className="h-4 w-4 opacity-50" />
                                                                <span>{formatDeliveryDate(field.value)}</span>
                                                            </div>
                                                        )}
                                                    </SelectValue>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {getAvailableFridays().map((friday, index) => (
                                                    <SelectItem
                                                        key={friday.toISOString()}
                                                        value={friday.toISOString()}
                                                        className="text-right"
                                                    >
                                                        <div className="flex flex-col items-start">
                                                            <span>{formatDeliveryDate(friday)}</span>
                                                            {index === 0 && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    (הקרוב ביותר)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            משלוחים בימי שישי בלבד. הזמנות נסגרות ביום חמישי ב-18:00
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
                                            <Input {...field} placeholder="אם שונה מכתובת הלקוח" className="text-right" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Order Items Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>פריטי הזמנה</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {watchItems.map((item, index) => (
                            <div key={index} className="space-y-3 p-4 border rounded-lg">
                                <div className="grid gap-4 md:grid-cols-12">
                                    <div className="md:col-span-6">
                                        <Label>מנה</Label>
                                        <Select
                                            value={item.dishId}
                                            onValueChange={(value) => {
                                                const newItems = [...form.getValues('items')]
                                                newItems[index].dishId = value
                                                form.setValue('items', newItems)
                                            }}
                                        >
                                            <SelectTrigger className="text-right">
                                                <SelectValue placeholder="בחר מנה" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {dishes.map((dish) => (
                                                    <SelectItem key={dish.id} value={dish.id} className="text-right">
                                                        <div className="flex items-center justify-between w-full">
                                                            <span>{dish.name}</span>
                                                            <span className="text-muted-foreground ml-2">
                                                                ₪{dish.price}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <Label>כמות</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => {
                                                const newItems = [...form.getValues('items')]
                                                newItems[index].quantity = parseInt(e.target.value) || 1
                                                form.setValue('items', newItems)
                                            }}
                                            className="text-center"
                                        />
                                    </div>

                                    <div className="md:col-span-3">
                                        <Label>הערות</Label>
                                        <Input
                                            placeholder="הערות למנה"
                                            value={item.notes || ''}
                                            onChange={(e) => {
                                                const newItems = [...form.getValues('items')]
                                                newItems[index].notes = e.target.value
                                                form.setValue('items', newItems)
                                            }}
                                            className="text-right"
                                        />
                                    </div>

                                    <div className="md:col-span-1 flex items-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeItem(index)}
                                            disabled={watchItems.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Dish subtotal */}
                                {item.dishId && (
                                    <div className="text-sm text-muted-foreground text-right">
                                        סה״כ למנה: ₪{(dishes.find(d => d.id === item.dishId)?.price || 0) * item.quantity}
                                    </div>
                                )}
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addItem}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 ml-2" />
                            הוסף מנה
                        </Button>
                    </CardContent>
                </Card>

                {/* Notes Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>הערות</CardTitle>
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
                                            placeholder="הערות מיוחדות להזמנה..."
                                            rows={3}
                                            className="text-right"
                                            dir="rtl"
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        ההערות יועברו למטבח ולמשלוח
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Order Summary */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between text-lg font-semibold">
                            <span>סה״כ להזמנה:</span>
                            <span>₪{orderTotal.toFixed(2)}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/orders')}
                            disabled={isLoading}
                        >
                            ביטול
                        </Button>
                        <Button type="submit" disabled={isLoading} className="flex-1">
                            {isLoading ? 'יוצר הזמנה...' : 'צור הזמנה'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    )
}
