// src/app/(dashboard)/ingredients/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Package, AlertTriangle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IngredientList } from '@/components/ingredients/ingredient-list'
import { IngredientDialog } from '@/components/ingredients/ingredient-dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { useToast } from '@/lib/hooks/use-toast'
import type { Ingredient } from '@/lib/types/database'

interface IngredientWithStats extends Ingredient {
    dishCount: number
    dishes: {
        dish: {
            id: string
            name: string
            isAvailable: boolean
        }
    }[]
}

export default function IngredientsPage() {
    const [ingredients, setIngredients] = useState<IngredientWithStats[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedIngredient, setSelectedIngredient] = useState<IngredientWithStats | null>(null)

    const debouncedSearch = useDebounce(search, 300)
    const { toast } = useToast()

    useEffect(() => {
        fetchIngredients()
    }, [debouncedSearch])

    const fetchIngredients = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (debouncedSearch) params.append('search', debouncedSearch)

            const response = await fetch(`/api/ingredients?${params}`)
            if (!response.ok) throw new Error('Failed to fetch ingredients')

            const data = await response.json()
            setIngredients(data)
        } catch (error) {
            console.error('Error fetching ingredients:', error)
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לטעון את רשימת הרכיבים',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (ingredientId: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק רכיב זה?')) return

        try {
            const response = await fetch(`/api/ingredients/${ingredientId}`, {
                method: 'DELETE'
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete ingredient')
            }

            toast({
                title: 'הצלחה',
                description: 'הרכיב נמחק בהצלחה'
            })
            fetchIngredients()
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: error instanceof Error ? error.message : 'לא ניתן למחוק את הרכיב',
                variant: 'destructive'
            })
        }
    }

    const handleEdit = (ingredient: IngredientWithStats) => {
        setSelectedIngredient(ingredient)
        setDialogOpen(true)
    }

    const handleSave = async () => {
        // Dialog handles the API call, just refresh the list
        fetchIngredients()
        setDialogOpen(false)
    }

    const stats = {
        total: ingredients.length,
        lowStock: ingredients.filter(i =>
            i.currentStock && i.minStock && i.currentStock < i.minStock
        ).length,
        mostUsed: ingredients.filter(i => i.dishCount > 5).length,
        unused: ingredients.filter(i => i.dishCount === 0).length
    }

    if (loading && ingredients.length === 0) {
        return <LoadingSpinner />
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">ניהול רכיבים</h1>
                    <p className="text-muted-foreground">
                        נהל את מלאי הרכיבים למנות
                    </p>
                </div>
                <Button onClick={() => {
                    setSelectedIngredient(null)
                    setDialogOpen(true)
                }}>
                    <Plus className="ml-2 h-4 w-4" />
                    הוסף רכיב
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            סה"כ רכיבים
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            <span className="text-2xl font-bold">{stats.total}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            מלאי נמוך
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="text-2xl font-bold text-orange-600">{stats.lowStock}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            בשימוש גבוה
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-2xl font-bold text-green-600">{stats.mostUsed}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            לא בשימוש
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-600">{stats.unused}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="חיפוש רכיב או ספק..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pr-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Ingredients List */}
            <IngredientList
                ingredients={ingredients}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Add/Edit Dialog */}
            <IngredientDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                ingredient={selectedIngredient}
                onSave={handleSave}
            />
        </div>
    )
}
