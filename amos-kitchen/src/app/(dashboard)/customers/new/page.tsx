// app/(dashboard)/customers/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, User, Phone, Mail, MapPin, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/lib/hooks/use-toast'
import { postWithAuth } from '@/lib/api/fetch-with-auth'
import { PreferenceInput } from '@/components/customers/preference-input'
import type { CustomerPreference } from '@/lib/types/database'
import Link from 'next/link'

export default function NewCustomerPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        preferences: [] as Partial<CustomerPreference>[]
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handlePreferencesChange = (preferences: Partial<CustomerPreference>[]) => {
        setFormData(prev => ({ ...prev, preferences }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Basic validation
        if (!formData.name || !formData.phone) {
            toast({
                title: "שגיאה",
                description: "שם וטלפון הם שדות חובה",
                variant: "destructive"
            })
            return
        }

        // Validate phone format (Israeli format)
        const phoneRegex = /^0[0-9]{8,9}$/
        if (!phoneRegex.test(formData.phone.replace(/[-\s]/g, ''))) {
            toast({
                title: "שגיאה",
                description: "מספר טלפון לא תקין",
                variant: "destructive"
            })
            return
        }

        // Validate email if provided
        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(formData.email)) {
                toast({
                    title: "שגיאה",
                    description: "כתובת אימייל לא תקינה",
                    variant: "destructive"
                })
                return
            }
        }

        try {
            setIsSubmitting(true)

            const response = await postWithAuth('/api/customers', formData)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to create customer')
            }

            const newCustomer = await response.json()

            toast({
                title: "הלקוח נוסף בהצלחה",
                description: `${newCustomer.name} נוסף למערכת`,
            })

            // Redirect to customers page or back to new order page
            const redirectTo = new URLSearchParams(window.location.search).get('redirect')
            if (redirectTo === 'orders') {
                router.push('/orders/new')
            } else {
                router.push('/customers')
            }
        } catch (error) {
            console.error('Error creating customer:', error)
            toast({
                title: "שגיאה",
                description: error instanceof Error ? error.message : "שגיאה ביצירת הלקוח",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/dashboard" className="hover:text-foreground">
                    לוח בקרה
                </Link>
                <ChevronRight className="h-4 w-4" />
                <Link href="/customers" className="hover:text-foreground">
                    לקוחות
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">לקוח חדש</span>
            </div>

            {/* Page Title */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">הוספת לקוח חדש</h1>
                <p className="text-muted-foreground">
                    הזן את פרטי הלקוח החדש
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>פרטי לקוח</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                שם מלא *
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="דוגמה: ישראל ישראלי"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                טלפון *
                            </Label>
                            <Input
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="050-1234567"
                                dir="ltr"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                אימייל
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="example@email.com"
                                dir="ltr"
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <Label htmlFor="address" className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                כתובת
                            </Label>
                            <Input
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="רחוב, מספר בית, עיר"
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes" className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                הערות
                            </Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                placeholder="הערות נוספות על הלקוח..."
                                rows={4}
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Preferences */}
                        <div className="border-t pt-4">
                            <PreferenceInput
                                preferences={formData.preferences}
                                onChange={handlePreferencesChange}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                    >
                        ביטול
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "שומר..." : "שמור לקוח"}
                    </Button>
                </div>
            </form>
        </div>
    )
}