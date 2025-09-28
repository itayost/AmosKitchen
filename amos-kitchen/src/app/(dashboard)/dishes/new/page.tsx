// src/app/(dashboard)/dishes/new/page.tsx
'use client'

import { useState } from 'react'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import { useRouter } from 'next/navigation'
import { ArrowRight, Save, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                >
                    <ArrowRight className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">הוספת מנה חדשה</h1>
                    <p className="text-muted-foreground">
                        הוסף מנה חדשה לתפריט
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>פרטי המנה</CardTitle>
                        <CardDescription>
                            הזן את המידע הבסיסי של המנה החדשה
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">שם המנה *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="לדוגמה: שניצל עוף"
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && (
                                <span className="text-xs text-red-500">{errors.name}</span>
                            )}
                        </div>

                        <div className="grid gap-2">
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
                            <div className="grid gap-2">
                                <Label htmlFor="price">מחיר (₪) *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0.00"
                                    className={errors.price ? 'border-red-500' : ''}
                                />
                                {errors.price && (
                                    <span className="text-xs text-red-500">{errors.price}</span>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="category">קטגוריה *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
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
                                    <span className="text-xs text-red-500">{errors.category}</span>
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
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-3 justify-end mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={saving}
                    >
                        ביטול
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        <Save className="ml-2 h-4 w-4" />
                        צור מנה
                    </Button>
                </div>
            </form>
        </div>
    )
}
