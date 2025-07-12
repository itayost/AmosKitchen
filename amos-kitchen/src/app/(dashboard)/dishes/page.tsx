// src/app/(dashboard)/dishes/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Download, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DishList } from '@/components/dishes/dish-list'
import { DishGrid } from '@/components/dishes/dish-grid'
import { DishDialog, type DishWithIngredients } from '@/components/dishes/dish-dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { useToast } from '@/lib/hooks/use-toast'
import Link from 'next/link'
import type { Dish } from '@/lib/types/database'

interface DishWithStats extends Dish {
    orderCount: number
    // Remove totalQuantity
    ingredients: {
        ingredient: {
            name: string
        }
    }[]
}

const categories = [
    { value: 'all', label: 'כל הקטגוריות' },
    { value: 'appetizer', label: 'מנות ראשונות' },
    { value: 'main', label: 'מנות עיקריות' },
    { value: 'side', label: 'תוספות' },
    { value: 'dessert', label: 'קינוחים' },
    { value: 'beverage', label: 'משקאות' }
]

export default function DishesPage() {
    const [dishes, setDishes] = useState<DishWithStats[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedDish, setSelectedDish] = useState<DishWithIngredients | null>(null)

    const debouncedSearch = useDebounce(search, 300)
    const { toast } = useToast()

    useEffect(() => {
        fetchDishes()
    }, [debouncedSearch, selectedCategory])

    const fetchDishes = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (debouncedSearch) params.append('search', debouncedSearch)
            if (selectedCategory !== 'all') params.append('category', selectedCategory)

            const response = await fetch(`/api/dishes?${params}`)
            if (!response.ok) throw new Error('Failed to fetch dishes')

            const data = await response.json()
            setDishes(data)
        } catch (error) {
            console.error('Error fetching dishes:', error)
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לטעון את רשימת המנות',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (dishId: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק מנה זו?')) return

        try {
            const response = await fetch(`/api/dishes/${dishId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to delete dish')
            }

            toast({
                title: 'הצלחה',
                description: 'המנה נמחקה בהצלחה'
            })
            fetchDishes()
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: error instanceof Error ? error.message : 'לא ניתן למחוק את המנה',
                variant: 'destructive'
            })
        }
    }

    const handleEdit = async (dish: DishWithStats) => {
        try {
            const response = await fetch(`/api/dishes/${dish.id}`)
            if (!response.ok) throw new Error('Failed to fetch dish')
            const fullDish = await response.json()
            setSelectedDish(fullDish)
            setDialogOpen(true)
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: 'נכשל בטעינת פרטי המנה',
                variant: 'destructive'
            })
        }
    }

    const handleSave = async (dishData: Partial<Dish>) => {
        try {
            const url = selectedDish
                ? `/api/dishes/${selectedDish.id}`
                : '/api/dishes'

            const response = await fetch(url, {
                method: selectedDish ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dishData)
            })

            if (!response.ok) throw new Error('Failed to save dish')

            toast({
                title: 'הצלחה',
                description: selectedDish ? 'המנה עודכנה בהצלחה' : 'המנה נוספה בהצלחה'
            })

            setDialogOpen(false)
            setSelectedDish(null)
            fetchDishes()
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לשמור את המנה',
                variant: 'destructive'
            })
        }
    }

    const stats = {
        total: dishes.length,
        available: dishes.filter(d => d.isAvailable).length,
        unavailable: dishes.filter(d => !d.isAvailable).length,
        popular: dishes.filter(d => d.orderCount > 10).length
    }

    if (loading && dishes.length === 0) {
        return <LoadingSpinner />
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">ניהול מנות</h1>
                    <p className="text-muted-foreground">
                        נהל את תפריט המנות של המסעדה
                    </p>
                </div>
                <Button onClick={() => {
                    setSelectedDish(null)
                    setDialogOpen(true)
                }}>
                    <Plus className="ml-2 h-4 w-4" />
                    הוסף מנה
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            סה"כ מנות
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            זמינות
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.available}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            לא זמינות
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.unavailable}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            פופולריות
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.popular}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="חיפוש מנה..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pr-10"
                                />
                            </div>
                        </div>
                        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                            <TabsList>
                                {categories.map(cat => (
                                    <TabsTrigger key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                        <div className="flex gap-2">
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                            >
                                רשימה
                            </Button>
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                            >
                                רשת
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dishes Display */}
            {viewMode === 'list' ? (
                <DishList
                    dishes={dishes}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            ) : (
                <DishGrid
                    dishes={dishes}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            {/* Add/Edit Dialog */}
            <DishDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                dish={selectedDish}
                onSave={handleSave}
            />
        </div>
    )
}
