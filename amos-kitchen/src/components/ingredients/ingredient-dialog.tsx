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
    onSave: (ingredient: Partial<Ingredient>) => Promise<void>
}

interface FormData {
    name: string
    unit: string
    currentStock: string
    minStock: string
    costPerUnit: string
    supplier: string
    category: string
}

interface FormErrors {
    name?: string
    unit?: string
    currentStock?: string
    minStock?: string
    costPerUnit?: string
}

const units = [
    { value: 'kg', label: 'קילוגרם' },
    { value: 'gram', label: 'גרם' },
    { value: 'liter', label: 'ליטר' },
    { value: 'ml', label: 'מיליליטר' },
    { value: 'unit', label: 'יחידה' }
]

const categories = [
    { value: 'vegetables', label: 'ירקות' },
    { value: 'fruits', label: 'פירות' },
    { value: 'meat', label: 'בשר' },
    { value: 'dairy', label: 'חלב' },
    { value: 'grains', label: 'דגנים' },
    { value: 'spices', label: 'תבלינים' },
    { value: 'oils', label: 'שמנים' },
    { value: 'other', label: 'אחר' }
]

export function IngredientDialog({ open, onOpenChange, ingredient, onSave }: IngredientDialogProps) {
    const { toast } = useToast()
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<FormData>({
        name: '',
        unit: '',
        currentStock: '',
        minStock: '',
        costPerUnit: '',
        supplier: '',
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
                costPerUnit: ingredient.costPerUnit?.toString() || '',
                supplier: ingredient.supplier || '',
                category: ingredient.category || ''
            })
        } else {
            setFormData({
                name: '',
                unit: '',
                currentStock: '',
                minStock: '',
                costPerUnit: '',
                supplier: '',
                category: ''
            })
        }
        setErrors({})
    }, [ingredient, open])

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = 'שם הרכיב הוא שדה חובה'
        }

        if (!formData.unit) {
            newErrors.unit = 'יחידת מידה היא שדה חובה'
        }

        if (formData.currentStock && (isNaN(Number(formData.currentStock)) || Number(formData.currentStock) < 0)) {
            newErrors.currentStock = 'מלאי חייב להיות מספר חיובי'
        }

        if (formData.minStock && (isNaN(Number(formData.minStock)) || Number(formData.minStock) < 0)) {
            newErrors.minStock = 'מלאי מינימלי חייב להיות מספר חיובי'
        }

        if (formData.costPerUnit && (isNaN(Number(formData.costPerUnit)) || Number(formData.costPerUnit) < 0)) {
            newErrors.costPerUnit = 'עלות חייבת להיות מספר חיובי'
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
                unit: formData.unit,
                currentStock: formData.currentStock ? Number(formData.currentStock) : undefined,
                minStock: formData.minStock ? Number(formData.minStock) : undefined,
                costPerUnit: formData.costPerUnit ? Number(formData.costPerUnit) : undefined,
                supplier: formData.supplier.trim() || undefined,
                category: formData.category || undefined
            })
            onOpenChange(false)
        } catch (error) {
            // Error handling is done in the parent component
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {ingredient ? 'עריכת רכיב' : 'הוספת רכיב חדש'}
                        </DialogTitle>
                        <DialogDescription>
                            {ingredient ? 'ערוך את פרטי הרכיב' : 'הזן את פרטי הרכיב החדש'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">שם הרכיב *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="לדוגמה: עגבניה"
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && (
                                    <span className="text-xs text-red-500">{errors.name}</span>
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
                                    <span className="text-xs text-red-500">{errors.unit}</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="currentStock">מלאי נוכחי</Label>
                                <Input
                                    id="currentStock"
                                    type="number"
                                    step="0.01"
                                    value={formData.currentStock}
                                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                                    placeholder="0"
                                    className={errors.currentStock ? 'border-red-500' : ''}
                                />
                                {errors.currentStock && (
                                    <span className="text-xs text-red-500">{errors.currentStock}</span>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="minStock">מלאי מינימלי</Label>
                                <Input
                                    id="minStock"
                                    type="number"
                                    step="0.01"
                                    value={formData.minStock}
                                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                                    placeholder="0"
                                    className={errors.minStock ? 'border-red-500' : ''}
                                />
                                {errors.minStock && (
                                    <span className="text-xs text-red-500">{errors.minStock}</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="costPerUnit">עלות ליחידה (₪)</Label>
                                <Input
                                    id="costPerUnit"
                                    type="number"
                                    step="0.01"
                                    value={formData.costPerUnit}
                                    onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                                    placeholder="0.00"
                                    className={errors.costPerUnit ? 'border-red-500' : ''}
                                />
                                {errors.costPerUnit && (
                                    <span className="text-xs text-red-500">{errors.costPerUnit}</span>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="category">קטגוריה</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
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
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="supplier">ספק</Label>
                            <Input
                                id="supplier"
                                value={formData.supplier}
                                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                placeholder="שם הספק"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={saving}
                        >
                            ביטול
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            {ingredient ? 'עדכן' : 'הוסף'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
