// src/app/(dashboard)/dishes/new/page.tsx
'use client'

import { useState } from 'react'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import { useRouter } from 'next/navigation'
import { FormPageLayout, FormSection, FormActions } from '@/components/forms'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/lib/hooks/use-toast'

interface FormData {
    name: string
    description: string
    price: string
    category: string
    isAvailable: boolean
}

interface FormErrors {
    name?: string
    price?: string
    category?: string
}

const categories = [
    { value: 'appetizer', label: 'מנה ראשונה' },
    { value: 'main', label: 'מנה עיקרית' },
    { value: 'side', label: 'תוספת' },
    { value: 'dessert', label: 'קינוח' },
    { value: 'beverage', label: 'משקה' }
]

export default function NewDishPage() {
    const router = useRouter()
    const { toast } = useToast()

    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        price: '',
        category: '',
        isAvailable: true
    })
    const [errors, setErrors] = useState<FormErrors>({})

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = 'שם המנה הוא שדה חובה'
        }

        if (!formData.price.trim()) {
            newErrors.price = 'מחיר הוא שדה חובה'
        } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
            newErrors.price = 'מחיר חייב להיות מספר חיובי'
        }

        if (!formData.category) {
            newErrors.category = 'קטגוריה היא שדה חובה'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setSaving(true)
        try {
            const response = await fetchWithAuth('/api/dishes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    description: formData.description.trim() || undefined,
                    price: Number(formData.price),
                    category: formData.category,
                    isAvailable: formData.isAvailable
                })
            })

            if (!response.ok) throw new Error('Failed to create dish')

            const newDish = await response.json()

            toast({
                title: 'הצלחה',
                description: 'המנה נוספה בהצלחה'
            })
            router.push(`/dishes/${newDish.id}`)
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: 'לא ניתן ליצור את המנה',
                variant: 'destructive'
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <FormPageLayout
            breadcrumbs={[
                { label: 'לוח בקרה', href: '/dashboard' },
                { label: 'מנות', href: '/dishes' },
                { label: 'מנה חדשה' }
            ]}
            title="הוספת מנה חדשה"
            description="הוסף מנה חדשה לתפריט"
        >
            <form onSubmit={handleSubmit}>
                <FormSection
                    title="פרטי המנה"
                    description="הזן את המידע הבסיסי של המנה החדשה"
                >
                    <div className="space-y-2">
                        <Label htmlFor="name">שם המנה *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="לדוגמה: שניצל עוף"
                            className={errors.name ? 'border-destructive' : ''}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">תיאור</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="תיאור קצר של המנה"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">מחיר (₪) *</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="0.00"
                                className={errors.price ? 'border-destructive' : ''}
                            />
                            {errors.price && (
                                <p className="text-sm text-destructive">{errors.price}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">קטגוריה *</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                                    <SelectValue placeholder="בחר קטגוריה" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category && (
                                <p className="text-sm text-destructive">{errors.category}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                        <Switch
                            id="available"
                            checked={formData.isAvailable}
                            onCheckedChange={(checked) =>
                                setFormData({ ...formData, isAvailable: checked })
                            }
                        />
                        <Label htmlFor="available" className="cursor-pointer">
                            המנה זמינה להזמנה
                        </Label>
                    </div>
                </FormSection>

                <FormActions
                    onCancel={() => router.back()}
                    submitLabel="צור מנה"
                    isSubmitting={saving}
                />
            </form>
        </FormPageLayout>
    )
}
