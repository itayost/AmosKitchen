// app/(dashboard)/customers/[id]/edit/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowRight, Save, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useToast } from '@/lib/hooks/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import type { Customer } from '@/lib/types/database'

interface FormData {
    name: string
    phone: string
    email: string
    address: string
    notes: string
}

interface FormErrors {
    name?: string
    phone?: string
    email?: string
}

export default function CustomerEditPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const customerId = params.id as string

    const [customer, setCustomer] = useState<Customer | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<FormData>({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
    })
    const [errors, setErrors] = useState<FormErrors>({})
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        fetchCustomer()
    }, [customerId])

    const fetchCustomer = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/customers/${customerId}`)

            if (!response.ok) {
                throw new Error('Failed to fetch customer')
            }

            const data = await response.json()
            setCustomer(data)
            setFormData({
                name: data.name || '',
                phone: data.phone || '',
                email: data.email || '',
                address: data.address || '',
                notes: data.notes || ''
            })
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לטעון את פרטי הלקוח',
                variant: 'destructive'
            })
            router.push('/customers')
        } finally {
            setLoading(false)
        }
    }

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = 'שם הלקוח הוא שדה חובה'
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'שם הלקוח חייב להכיל לפחות 2 תווים'
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'מספר טלפון הוא שדה חובה'
        } else if (!/^[\d-+\s()]+$/.test(formData.phone)) {
            newErrors.phone = 'מספר טלפון לא תקין'
        } else if (formData.phone.replace(/\D/g, '').length < 9) {
            newErrors.phone = 'מספר טלפון חייב להכיל לפחות 9 ספרות'
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'כתובת אימייל לא תקינה'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setHasChanges(true)

        // Clear error for this field when user starts typing
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setSaving(true)

            // Prepare data for submission
            const dataToSubmit = {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim() || null,
                address: formData.address.trim() || null,
                notes: formData.notes.trim() || null
            }

            const response = await fetch(`/api/customers/${customerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSubmit)
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update customer')
            }

            toast({
                title: 'נשמר בהצלחה',
                description: 'פרטי הלקוח עודכנו בהצלחה'
            })

            router.push(`/customers/${customerId}`)
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: error instanceof Error ? error.message : 'אירעה שגיאה בעדכון הלקוח',
                variant: 'destructive'
            })
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        if (hasChanges) {
            // Show confirmation dialog if there are unsaved changes
            return
        }
        router.push(`/customers/${customerId}`)
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        )
    }

    if (!customer) {
        return null
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/customers/${customerId}`)}
                    >
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">עריכת לקוח</h1>
                        <p className="text-muted-foreground">עדכון פרטי לקוח קיים</p>
                    </div>
                </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>פרטי לקוח</CardTitle>
                        <CardDescription>
                            עדכן את פרטי הלקוח. שדות המסומנים ב-* הם שדות חובה.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name Field */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    שם הלקוח <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="לדוגמה: ישראל ישראלי"
                                    className={errors.name ? 'border-destructive' : ''}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            {/* Phone Field */}
                            <div className="space-y-2">
                                <Label htmlFor="phone">
                                    טלפון <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    placeholder="050-1234567"
                                    dir="ltr"
                                    className={errors.phone ? 'border-destructive' : ''}
                                />
                                {errors.phone && (
                                    <p className="text-sm text-destructive">{errors.phone}</p>
                                )}
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email">אימייל</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    placeholder="example@email.com"
                                    dir="ltr"
                                    className={errors.email ? 'border-destructive' : ''}
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email}</p>
                                )}
                            </div>

                            {/* Address Field */}
                            <div className="space-y-2">
                                <Label htmlFor="address">כתובת</Label>
                                <Input
                                    id="address"
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    placeholder="רחוב הרצל 1, תל אביב"
                                />
                            </div>
                        </div>

                        {/* Notes Field */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">הערות והעדפות תזונתיות</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                placeholder="לדוגמה: צמחוני, אלרגיה לאגוזים, מעדיף משלוחים בשעות הצהריים..."
                                rows={4}
                                className="resize-none"
                            />
                            <p className="text-sm text-muted-foreground">
                                הוסף כאן הערות מיוחדות, העדפות תזונתיות, אלרגיות או כל מידע רלוונטי אחר
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                    {hasChanges ? (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="outline">
                                    ביטול
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        יש שינויים שלא נשמרו. האם אתה בטוח שברצונך לצאת ללא שמירה?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>המשך עריכה</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => router.push(`/customers/${customerId}`)}>
                                        צא ללא שמירה
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                        <Button type="button" variant="outline" onClick={handleCancel}>
                            ביטול
                        </Button>
                    )}

                    <Button type="submit" disabled={saving || !hasChanges}>
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                שומר...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 ml-2" />
                                שמור שינויים
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
