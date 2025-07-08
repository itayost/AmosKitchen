// src/components/dishes/ingredients-selector.tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Search } from 'lucide-react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Ingredient } from '@/lib/types/database'

export interface DishIngredient {
    ingredientId: string
    quantity: number
    notes?: string
}

interface IngredientsSelectorProps {
    ingredients: DishIngredient[]
    onChange: (ingredients: DishIngredient[]) => void
}

export function IngredientsSelector({ ingredients: selectedIngredients, onChange }: IngredientsSelectorProps) {
    const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchIngredients()
    }, [])

    const fetchIngredients = async () => {
        try {
            const response = await fetch('/api/ingredients')
            if (!response.ok) throw new Error('Failed to fetch ingredients')
            
            const data = await response.json()
            setAvailableIngredients(data)
        } catch (error) {
            console.error('Error fetching ingredients:', error)
        } finally {
            setLoading(false)
        }
    }

    const addIngredient = () => {
        onChange([
            ...selectedIngredients,
            { ingredientId: '', quantity: 1, notes: '' }
        ])
    }

    const removeIngredient = (index: number) => {
        const updated = selectedIngredients.filter((_, i) => i !== index)
        onChange(updated)
    }

    const updateIngredient = (index: number, field: keyof DishIngredient, value: any) => {
        const updated = [...selectedIngredients]
        updated[index] = { ...updated[index], [field]: value }
        onChange(updated)
    }

    const getUnitLabel = (ingredientId: string) => {
        const ingredient = availableIngredients.find(i => i.id === ingredientId)
        if (!ingredient) return ''
        
        const units: Record<string, string> = {
            kg: 'ק"ג',
            gram: 'גרם',
            liter: 'ליטר',
            ml: 'מ"ל',
            unit: 'יחידה'
        }
        return units[ingredient.unit] || ingredient.unit
    }

    const filteredIngredients = availableIngredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>רכיבי המנה</CardTitle>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addIngredient}
                    >
                        <Plus className="ml-2 h-4 w-4" />
                        הוסף רכיב
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {selectedIngredients.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                        לא נוספו רכיבים למנה זו
                    </p>
                ) : (
                    <div className="space-y-4">
                        {selectedIngredients.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 items-end">
                                <div className="col-span-5">
                                    <Label>רכיב</Label>
                                    <Select
                                        value={item.ingredientId}
                                        onValueChange={(value) => updateIngredient(index, 'ingredientId', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="בחר רכיב" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <div className="p-2">
                                                <div className="relative">
                                                    <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="חיפוש..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="pr-8 h-8"
                                                    />
                                                </div>
                                            </div>
                                            {loading ? (
                                                <div className="text-center py-2">טוען...</div>
                                            ) : (
                                                filteredIngredients.map(ing => (
                                                    <SelectItem key={ing.id} value={ing.id}>
                                                        {ing.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-3">
                                    <Label>כמות</Label>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={item.quantity}
                                            onChange={(e) => updateIngredient(index, 'quantity', Number(e.target.value))}
                                            placeholder="0"
                                        />
                                        <span className="text-sm text-muted-foreground min-w-[50px]">
                                            {getUnitLabel(item.ingredientId)}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-span-3">
                                    <Label>הערות</Label>
                                    <Input
                                        value={item.notes || ''}
                                        onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                                        placeholder="לדוגמה: קצוץ דק"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeIngredient(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
