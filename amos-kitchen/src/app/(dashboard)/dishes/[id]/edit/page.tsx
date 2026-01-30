// src/app/(dashboard)/dishes/[id]/edit/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import { FormPageLayout, FormSection, FormActions } from '@/components/forms'
import { Button } from '@/components/ui/button'
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/lib/hooks/use-toast'
import type { Dish } from '@/lib/types/database'

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

export default function EditDishPage() {
    const params = useParams()
    const router = useRouter()
    const dishId = params.id as string
    const { toast } = useToast()

    const [dish, setDish] = useState<Dish | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        price: '',
        category: '',
        isAvailable: true
    })
    const [errors, setErrors] = useState<FormErrors>({})

    const fetchDish = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetchWithAuth(`/api/dishes/${dishId}`)
            if (!response.ok) throw new Error('Failed to fetch dish')

            const data = await response.json()
            setDish(data)
            setFormData({
                name: data.name,
                description: data.description || '',
                price: data.price.toString(),
                category: data.category,
                isAvailable: data.isAvailable
            })
        } catch (err) {
            setError('לא ניתן לטעון את פרטי המנה')
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לטעון את פרטי המנה',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }, [dishId, toast])

    useEffect(() => {
        fetchDish()
    }, [fetchDish])

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
            const response = await fetchWithAuth(`/api/dishes/${dishId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    description: formData.description.trim() || undefined,
                    price: Number(formData.price),
                    category: formData.category,
                    isAvailable: formData.isAvailable
                })
            })

            if (!response.ok) throw new Error('Failed to update dish')

            toast({
                title: 'הצלחה',
                description: 'המנה עודכנה בהצלחה'
            })
            router.replace(`/dishes/${dishId}`)
        } catch (err) {
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לעדכן את המנה',
                variant: 'destructive'
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        try {
            setDeleting(true)
            const response = await fetchWithAuth(`/api/dishes/${dishId}`, {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Failed to delete dish')

            toast({
                title: 'הצלחה',
                description: 'המנה נמחקה בהצלחה'
            })
            router.push('/dishes')
        } catch (err) {
            toast({
                title: 'שגיאה',
                description: 'לא ניתן למחוק את המנה',
                variant: 'destructive'
            })
        } finally {
            setDeleting(false)
        }
    }

    // Delete button for header
    const deleteButton = (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                    <Trash2 className="h-4 w-4 ml-2" />
                    מחק מנה
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                    <AlertDialogDescription>
                        פעולה זו תמחק את המנה לצמיתות. לא ניתן לבטל פעולה זו.
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
                { label: 'מנות', href: '/dishes' },
                { label: dish?.name || 'מנה', href: `/dishes/${dishId}` },
                { label: 'עריכה' }
            ]}
            title="עריכת מנה"
            description={dish?.name}
            headerActions={deleteButton}
            isLoading={loading}
            loadingSkeletonConfig={{ sections: 1, fieldsPerSection: [5] }}
            error={error}
            onRetry={fetchDish}
        >
            <form onSubmit={handleSubmit}>
                <FormSection
                    title="פרטי המנה"
                    description="ערוך את המידע הבסיסי של המנה"
                >
                    <div className="space-y-2">
                        <Label htmlFor="name">שם המנה *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="לדוגמה: שניצל עוף"
                            className={errors.name ? 'border-destructive' : ''}
                            disabled={saving}
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
                            disabled={saving}
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
                                disabled={saving}
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
                                disabled={saving}
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
                            disabled={saving}
                        />
                        <Label htmlFor="available" className="cursor-pointer">
                            המנה זמינה להזמנה
                        </Label>
                    </div>
                </FormSection>

                <FormActions
                    onCancel={() => router.back()}
                    submitLabel="שמור שינויים"
                    isSubmitting={saving}
                />
            </form>
        </FormPageLayout>
    )
}
