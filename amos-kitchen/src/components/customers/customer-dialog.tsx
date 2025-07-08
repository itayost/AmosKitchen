// components/customers/customer-dialog.tsx
'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
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
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import type { Customer } from '@/lib/types/database'

const customerSchema = z.object({
    name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
    phone: z.string()
        .regex(/^[\d-+().\s]+$/, 'מספר טלפון לא תקין')
        .min(9, 'מספר טלפון חייב להכיל לפחות 9 ספרות'),
    email: z.string().email('כתובת אימייל לא תקינה').optional().or(z.literal('')),
    address: z.string().optional(),
    notes: z.string().optional()
})

type CustomerFormData = z.infer<typeof customerSchema>

interface CustomerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    customer: Customer | null
    onSave: (data: Partial<Customer>) => Promise<void>
}

export function CustomerDialog({ open, onOpenChange, customer, onSave }: CustomerDialogProps) {
    const form = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: '',
            phone: '',
            email: '',
            address: '',
            notes: ''
        }
    })

    useEffect(() => {
        if (customer) {
            form.reset({
                name: customer.name,
                phone: customer.phone,
                email: customer.email || '',
                address: customer.address || '',
                notes: customer.notes || ''
            })
        } else {
            form.reset({
                name: '',
                phone: '',
                email: '',
                address: '',
                notes: ''
            })
        }
    }, [customer, form])

    const onSubmit = async (data: CustomerFormData) => {
        try {
            // Convert empty strings to null for optional fields
            const customerData = {
                ...data,
                email: data.email || null,
                address: data.address || null,
                notes: data.notes || null
            }
            
            await onSave(customerData)
            form.reset()
        } catch (error) {
            console.error('Error saving customer:', error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{customer ? 'עריכת לקוח' : 'לקוח חדש'}</DialogTitle>
                    <DialogDescription>
                        {customer ? 'ערוך את פרטי הלקוח' : 'הזן את פרטי הלקוח החדש'}
                    </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>שם מלא *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ישראל ישראלי" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>טלפון *</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="050-1234567" 
                                            dir="ltr"
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>אימייל</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="email"
                                            placeholder="example@email.com" 
                                            dir="ltr"
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>כתובת</FormLabel>
                                    <FormControl>
                                        <Input placeholder="רחוב הרצל 1, תל אביב" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>הערות</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="העדפות תזונה, אלרגיות, הערות מיוחדות..."
                                            className="resize-none"
                                            rows={3}
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        הערות פנימיות על הלקוח (לא יוצגו ללקוח)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                ביטול
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? (
                                    <>
                                        <LoadingSpinner className="ml-2 h-4 w-4" />
                                        שומר...
                                    </>
                                ) : (
                                    customer ? 'עדכן' : 'הוסף'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
