// src/components/ingredients/ingredient-dialog.tsx
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/lib/hooks/use-toast'
import type { Ingredient } from '@/lib/types/database'

interface IngredientDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    ingredient: Ingredient | null
    onSave: () => void  // Keep this as is - it's just a success callback
}

interface FormData {
    name: string
    unit: string
    currentStock: string
    minStock: string
    category: string
}

interface FormErrors {
    name?: string
    unit?: string
    category?: string
}

const categories = [
    { value: 'vegetables', label: 'ירקות' },
    { value: 'meat', label: 'בשר' },
    { value: 'poultry', label: 'עוף' },
    { value: 'dairy', label: 'מוצרי חלב' },
    { value: 'grains', label: 'דגנים' },
    { value: 'spices', label: 'תבלינים' },
    { value: 'other', label: 'אחר' }
]

const units = [
    { value: 'kg', label: 'קילוגרם' },
    { value: 'gram', label: 'גרם' },
    { value: 'liter', label: 'ליטר' },
    { value: 'ml', label: 'מיליליטר' },
    { value: 'unit', label: 'יחידה' },
    { value: 'package', label: 'חבילה' },
    { value: 'dozen', label: 'תריסר' }
]

export function IngredientDialog({ open, onOpenChange, ingredient, onSave }: IngredientDialogProps) {
    const { toast } = useToast()
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<FormData>({
        name: '',
        unit: '',
        currentStock: '',
        minStock: '',
        category: ''
    })
    const [errors, setErrors] = useState<FormErrors>({})

    useEffect(() => {
        if (ingredient) {
            setFormData({
                name: ingredient.name || '',
                unit: ingredient.unit || '',
                currentStock: ingredient.currentStock?.toString() || '',
                minStock: ingredient.minStock?.toString() || '',
                category: ingredient.category || 'vegetables'  // Default to vegetables if missing
            })
        } else {
            setFormData({
                name: '',
                unit: 'kg',
                currentStock: '',
                minStock: '',
                category: 'vegetables'
            })
        }
        setErrors({})
    }, [ingredient, open])

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = 'שם הרכיב חובה'
        }

        if (!formData.unit) {
            newErrors.unit = 'יחידת מידה חובה'
        }

        if (!formData.category) {
            newErrors.category = 'קטגוריה חובה'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateForm()) return

        setSaving(true)
        try {
            const payload = {
                name: formData.name.trim(),
                unit: formData.unit,
                category: formData.category,
                currentStock: formData.currentStock ? parseFloat(formData.currentStock) : null,
                minStock: formData.minStock ? parseFloat(formData.minStock) : null
            }

            const url = ingredient
                ? `/api/ingredients/${ingredient.id}`
                : '/api/ingredients'

            const response = await fetch(url, {
                method: ingredient ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'שגיאה בשמירת הרכיב')
            }

            toast({
                title: ingredient ? 'הרכיב עודכן בהצלחה' : 'הרכיב נוסף בהצלחה',
                variant: 'default'
            })

            onSave()
            onOpenChange(false)
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: error instanceof Error ? error.message : 'שגיאה בשמירת הרכיב',
                variant: 'destructive'
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{ingredient ? 'עריכת רכיב' : 'הוספת רכיב חדש'}</DialogTitle>
                    <DialogDescription>
                        {ingredient ? 'עדכן את פרטי הרכיב' : 'הזן את פרטי הרכיב החדש'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">שם הרכיב *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="לדוגמה: עגבנייה"
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                                    {categories.map(category => (
                                        <SelectItem key={category.value} value={category.value}>
                                            {category.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category && (
                                <p className="text-sm text-red-500">{errors.category}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="unit">יחידת מידה *</Label>
                            <Select
                                value={formData.unit}
                                onValueChange={(value) => setFormData({ ...formData, unit: value })}
                            >
                                <SelectTrigger className={errors.unit ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="בחר יחידה" />
                                </SelectTrigger>
                                <SelectContent>
                                    {units.map(unit => (
                                        <SelectItem key={unit.value} value={unit.value}>
                                            {unit.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.unit && (
                                <p className="text-sm text-red-500">{errors.unit}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="currentStock">מלאי נוכחי</Label>
                            <Input
                                id="currentStock"
                                type="number"
                                value={formData.currentStock}
                                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                                placeholder="0"
                                min="0"
                                step="0.1"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="minStock">מלאי מינימלי</Label>
                            <Input
                                id="minStock"
                                type="number"
                                value={formData.minStock}
                                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                                placeholder="0"
                                min="0"
                                step="0.1"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        ביטול
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        {ingredient ? 'עדכן' : 'הוסף'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
