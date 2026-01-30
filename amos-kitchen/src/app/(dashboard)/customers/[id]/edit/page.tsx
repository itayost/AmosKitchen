// app/(dashboard)/customers/[id]/edit/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { FormPageLayout, FormSection, FormActions } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/lib/hooks/use-toast'
import { PreferenceInput } from '@/components/customers/preference-input'
import { CriticalPreferenceAlert } from '@/components/customers/preference-badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { normalizePhoneNumber } from '@/lib/validators/customer'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import type { Customer, CustomerPreference } from '@/lib/types/database'

interface FormData {
    name: string
    phone: string
    email: string
    address: string
    notes: string
    preferences: Partial<CustomerPreference>[]
}

interface FormErrors {
    name?: string
    phone?: string
    email?: string
    preferences?: string
}

export default function EditCustomerPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const customerId = params.id as string

    const [customer, setCustomer] = useState<Customer | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [formData, setFormData] = useState<FormData>({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        preferences: []
    })
    const [errors, setErrors] = useState<FormErrors>({})
    const [hasChanges, setHasChanges] = useState(false)

    const fetchCustomerDetails = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetchWithAuth(`/api/customers/${customerId}`)

            if (!response.ok) {
                throw new Error('Failed to fetch customer')
            }

            const data = await response.json()
            setCustomer(data)

            // Initialize form data
            setFormData({
                name: data.name || '',
                phone: data.phone || '',
                email: data.email || '',
                address: data.address || '',
                notes: data.notes || '',
                preferences: data.preferences || []
            })
        } catch (err) {
            setError('אירעה שגיאה בטעינת פרטי הלקוח')
            toast({
                title: 'שגיאה',
                description: 'אירעה שגיאה בטעינת פרטי הלקוח',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }, [customerId, toast])

    useEffect(() => {
        fetchCustomerDetails()
    }, [fetchCustomerDetails])

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = 'שם הלקוח הוא שדה חובה'
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'מספר טלפון הוא שדה חובה'
        } else if (!/^[\d-+\s()]+$/.test(formData.phone)) {
            newErrors.phone = 'מספר טלפון לא תקין'
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'כתובת אימייל לא תקינה'
        }

        // Validate preferences
        const seenPreferences = new Set<string>()
        for (const pref of formData.preferences) {
            const key = `${pref.type}-${pref.value?.toLowerCase()}`
            if (seenPreferences.has(key)) {
                newErrors.preferences = 'קיימות העדפות כפולות'
                break
            }
            seenPreferences.add(key)
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setHasChanges(true)
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

            const response = await fetchWithAuth(`/api/customers/${customerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    phone: normalizePhoneNumber(formData.phone.trim()),
                    email: formData.email.trim() || null,
                    address: formData.address.trim() || null,
                    notes: formData.notes.trim() || null,
                    preferences: formData.preferences.map(pref => ({
                        type: pref.type,
                        value: pref.value,
                        notes: pref.notes
                    }))
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update customer')
            }

            toast({
                title: 'הלקוח עודכן בהצלחה',
                description: 'השינויים נשמרו במערכת'
            })

            router.push(`/customers/${customerId}`)
        } catch (err) {
            toast({
                title: 'שגיאה',
                description: err instanceof Error ? err.message : 'אירעה שגיאה בעדכון הלקוח',
                variant: 'destructive'
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        try {
            setDeleting(true)

            const response = await fetchWithAuth(`/api/customers/${customerId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to delete customer')
            }

            toast({
                title: 'הלקוח נמחק בהצלחה',
                description: 'הלקוח הוסר מהמערכת'
            })

            router.push('/customers')
        } catch (err) {
            toast({
                title: 'שגיאה',
                description: err instanceof Error ? err.message : 'אירעה שגיאה במחיקת הלקוח',
                variant: 'destructive'
            })
        } finally {
            setDeleting(false)
        }
    }

    const handleCancel = () => {
        if (hasChanges) {
            if (confirm('יש שינויים שלא נשמרו. האם אתה בטוח שברצונך לצאת?')) {
                router.push(`/customers/${customerId}`)
            }
        } else {
            router.push(`/customers/${customerId}`)
        }
    }

    const hasCriticalPreferences = formData.preferences.some(
        p => p.type === 'ALLERGY' || p.type === 'MEDICAL'
    )

    // Delete button for header
    const deleteButton = (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                    <Trash2 className="h-4 w-4 ml-2" />
                    מחק לקוח
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                    <AlertDialogDescription>
                        פעולה זו תמחק את הלקוח לצמיתות. לא ניתן לבטל פעולה זו.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        מחק
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )

    return (
        <FormPageLayout
            breadcrumbs={[
                { label: 'לוח בקרה', href: '/dashboard' },
                { label: 'לקוחות', href: '/customers' },
                { label: customer?.name || 'לקוח', href: `/customers/${customerId}` },
                { label: 'עריכה' }
            ]}
            title="עריכת לקוח"
            description={customer?.name}
            headerActions={deleteButton}
            isLoading={loading}
            loadingSkeletonConfig={{ sections: 2, fieldsPerSection: [5, 3] }}
            error={error}
            onRetry={fetchCustomerDetails}
        >
            {/* Critical Preferences Alert */}
            {hasCriticalPreferences && (
                <CriticalPreferenceAlert
                    preferences={formData.preferences as CustomerPreference[]}
                />
            )}

            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {/* Basic Information */}
                    <FormSection
                        title="פרטים בסיסיים"
                        description="עדכן את פרטי הלקוח הבסיסיים"
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">שם הלקוח *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className={errors.name ? 'border-destructive' : ''}
                                    disabled={saving}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">טלפון *</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className={errors.phone ? 'border-destructive' : ''}
                                    disabled={saving}
                                    dir="ltr"
                                />
                                {errors.phone && (
                                    <p className="text-sm text-destructive">{errors.phone}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">אימייל</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className={errors.email ? 'border-destructive' : ''}
                                    disabled={saving}
                                    dir="ltr"
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">כתובת</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    disabled={saving}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">הערות</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                placeholder="הערות כלליות על הלקוח..."
                                disabled={saving}
                                rows={3}
                            />
                        </div>
                    </FormSection>

                    {/* Preferences */}
                    <FormSection
                        title="העדפות והגבלות תזונתיות"
                        description="נהל את ההעדפות וההגבלות התזונתיות של הלקוח"
                    >
                        <PreferenceInput
                            preferences={formData.preferences}
                            onChange={(preferences) => handleInputChange('preferences', preferences)}
                            errors={errors as Record<string, string>}
                        />
                    </FormSection>

                    <FormActions
                        onCancel={handleCancel}
                        submitLabel="שמור שינויים"
                        isSubmitting={saving}
                    />
                </div>
            </form>
        </FormPageLayout>
    )
}
