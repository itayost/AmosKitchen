// src/components/dishes/dish-dialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
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

interface DishDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    dish: Dish | null
    onSave: (dish: Partial<Dish>) => Promise<void>
}

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

export function DishDialog({ open, onOpenChange, dish, onSave }: DishDialogProps) {
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

    // Initialize form data when dialog opens or dish changes
    useEffect(() => {
        if (open) {
            if (dish) {
                // Editing existing dish
                setFormData({
                    name: dish.name || '',
                    description: dish.description || '',
                    price: dish.price?.toString() || '',
                    category: dish.category || '',
                    isAvailable: dish.isAvailable ?? true
                })
            } else {
                // Creating new dish
                resetForm()
            }
            setErrors({})
        }
    }, [dish, open])

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            category: '',
            isAvailable: true
        })
        setErrors({})
    }

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
            await onSave({
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                price: Number(formData.price),
                category: formData.category,
                isAvailable: formData.isAvailable
            })

            // Close dialog after successful save
            onOpenChange(false)
        } catch (error) {
            // Error is handled by parent component
            console.error('Error saving dish:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleClose = () => {
        if (!saving) {
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {dish ? 'עריכת מנה' : 'הוספת מנה חדשה'}
                        </DialogTitle>
                        <DialogDescription>
                            {dish
                                ? 'ערוך את פרטי המנה'
                                : 'הזן את פרטי המנה החדשה'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {/* Dish Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">שם המנה *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="לדוגמה: שניצל עוף"
                                className={errors.name ? 'border-red-500' : ''}
                                disabled={saving}
                            />
                            {errors.name && (
                                <span className="text-xs text-red-500">{errors.name}</span>
                            )}
                        </div>

                        {/* Description */}
                        <div className="grid gap-2">
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

                        {/* Price and Category */}
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
                                    disabled={saving}
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
                                    disabled={saving}
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

                        {/* Availability */}
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
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={saving}
                        >
                            ביטול
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            {dish ? 'עדכן' : 'הוסף'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}