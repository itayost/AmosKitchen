// components/customers/customer-dialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Eye } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/lib/hooks/use-toast'
import { PreferenceInput } from './preference-input'
import { normalizePhoneNumber } from '@/lib/validators/customer'
import type { Customer, CustomerPreference } from '@/lib/types/database'

interface CustomerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    customer: Customer | null
    onSave: (customer: Partial<Customer>) => Promise<void>
}

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

export function CustomerDialog({
    open,
    onOpenChange,
    customer,
    onSave
}: CustomerDialogProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [saving, setSaving] = useState(false)
    const [savedCustomerId, setSavedCustomerId] = useState<string | null>(null)
    const [formData, setFormData] = useState<FormData>({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        preferences: []
    })
    const [errors, setErrors] = useState<FormErrors>({})

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                phone: customer.phone || '',
                email: customer.email || '',
                address: customer.address || '',
                notes: customer.notes || '',
                preferences: customer.preferences || []
            })
        } else {
            setFormData({
                name: '',
                phone: '',
                email: '',
                address: '',
                notes: '',
                preferences: []
            })
        }
        setSavedCustomerId(null)
        setErrors({})
    }, [customer, open])

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setSaving(true)

            const dataToSubmit = {
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
            }

            await onSave(dataToSubmit as Partial<Customer>)

            // If it's a new customer, we'll need to get the ID from the response
            // For now, we'll assume the onSave callback handles navigation
            if (!customer) {
                setSavedCustomerId('new') // Placeholder - in real implementation, get ID from response
            } else {
                setSavedCustomerId(customer.id)
            }

            toast({
                title: customer ? 'הלקוח עודכן בהצלחה' : 'הלקוח נוסף בהצלחה',
                description: 'הפרטים נשמרו במערכת'
            })

            if (!customer) {
                // For new customers, show success state with option to view profile
                // Don't close dialog immediately
            } else {
                onOpenChange(false)
            }
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: 'אירעה שגיאה בשמירת הלקוח',
                variant: 'destructive'
            })
        } finally {
            setSaving(false)
        }
    }

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const handleViewProfile = () => {
        if (savedCustomerId && savedCustomerId !== 'new') {
            router.push(`/customers/${savedCustomerId}`)
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {customer ? 'עריכת לקוח' : 'הוספת לקוח חדש'}
                        </DialogTitle>
                        <DialogDescription>
                            {customer ? 'עדכן את פרטי הלקוח' : 'הזן את פרטי הלקוח החדש'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <div className="grid gap-2">
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

                            <div className="grid gap-2">
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

                            <div className="grid gap-2">
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

                            <div className="grid gap-2">
                                <Label htmlFor="address">כתובת</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    disabled={saving}
                                />
                            </div>

                            <div className="grid gap-2">
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
                        </div>

                        <Separator />

                        {/* Preferences Section */}
                        <PreferenceInput
                            preferences={formData.preferences}
                            onChange={(preferences) => handleInputChange('preferences', preferences)}
                            errors={errors as Record<string, string>}
                        />
                    </div>

                    <DialogFooter>
                        {savedCustomerId && !customer ? (
                            <div className="flex gap-2 w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="flex-1"
                                >
                                    סגור
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleViewProfile}
                                    className="flex-1"
                                >
                                    <Eye className="h-4 w-4 ml-2" />
                                    צפייה בפרופיל
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={saving}
                                >
                                    ביטול
                                </Button>
                                <Button type="submit" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                            שומר...
                                        </>
                                    ) : (
                                        customer ? 'עדכון' : 'הוספה'
                                    )}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
