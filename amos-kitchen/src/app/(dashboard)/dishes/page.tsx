// src/app/(dashboard)/dishes/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Plus,
    Search,
    Filter,
    Package,
    DollarSign,
    ShoppingCart,
    TrendingUp,
    Calendar,
    Users,
    Eye,
    Edit,
    Trash2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import Link from 'next/link'

interface Dish {
    id: string
    name: string
    description?: string
    price: number
    category: string
    isAvailable: boolean
    orderCount: number
    createdAt: string
    updatedAt: string
}

export default function DishesPage() {
    const router = useRouter()
    const [dishes, setDishes] = useState<Dish[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [availabilityFilter, setAvailabilityFilter] = useState<string>('all')

    useEffect(() => {
        fetchDishes()
    }, [searchTerm, categoryFilter, availabilityFilter])

    const fetchDishes = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()

            if (searchTerm) params.append('search', searchTerm)
            if (categoryFilter !== 'all') params.append('category', categoryFilter)
            if (availabilityFilter !== 'all') params.append('available', availabilityFilter)

            const response = await fetch(`/api/dishes?${params.toString()}`)

            if (!response.ok) {
                throw new Error('Failed to fetch dishes')
            }

            const data = await response.json()
            setDishes(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'שגיאה בטעינת המנות')
        } finally {
            setLoading(false)
        }
    }

    const getCategoryBadgeColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'appetizer': return 'bg-orange-100 text-orange-800'
            case 'main': return 'bg-blue-100 text-blue-800'
            case 'side': return 'bg-green-100 text-green-800'
            case 'dessert': return 'bg-pink-100 text-pink-800'
            case 'beverage': return 'bg-purple-100 text-purple-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getCategoryLabel = (category: string) => {
        switch (category.toLowerCase()) {
            case 'appetizer': return 'מקדימות'
            case 'main': return 'עיקריות'
            case 'side': return 'תוספות'
            case 'dessert': return 'קינוחים'
            case 'beverage': return 'משקאות'
            default: return category
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={fetchDishes}>נסה שוב</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">מנות</h1>
                    <p className="text-muted-foreground">
                        נהל את התפריט של המסעדה
                    </p>
                </div>
                <Link href="/dishes/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        הוסף מנה
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            סה"כ מנות
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dishes.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            מנות זמינות
                        </CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {dishes.filter(dish => dish.isAvailable).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            מחיר ממוצע
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₪{dishes.length > 0 ? Math.round(dishes.reduce((sum, dish) => sum + dish.price, 0) / dishes.length) : 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            הזמנות השבוע
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {dishes.reduce((sum, dish) => sum + dish.orderCount, 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>סינון</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="חפש מנות..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="קטגוריה" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">כל הקטגוריות</SelectItem>
                                <SelectItem value="appetizer">מקדימות</SelectItem>
                                <SelectItem value="main">עיקריות</SelectItem>
                                <SelectItem value="side">תוספות</SelectItem>
                                <SelectItem value="dessert">קינוחים</SelectItem>
                                <SelectItem value="beverage">משקאות</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="זמינות" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">הכל</SelectItem>
                                <SelectItem value="true">זמין</SelectItem>
                                <SelectItem value="false">לא זמין</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Dishes Table */}
            <Card>
                <CardHeader>
                    <CardTitle>רשימת מנות</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>שם</TableHead>
                                <TableHead>קטגוריה</TableHead>
                                <TableHead>מחיר</TableHead>
                                <TableHead>זמינות</TableHead>
                                <TableHead>הזמנות</TableHead>
                                <TableHead>תאריך יצירה</TableHead>
                                <TableHead>פעולות</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dishes.map((dish) => (
                                <TableRow key={dish.id}>
                                    <TableCell className="font-medium">
                                        <div>
                                            <div className="font-medium">{dish.name}</div>
                                            {dish.description && (
                                                <div className="text-sm text-muted-foreground">
                                                    {dish.description}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getCategoryBadgeColor(dish.category)}>
                                            {getCategoryLabel(dish.category)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>₪{dish.price}</TableCell>
                                    <TableCell>
                                        <Badge variant={dish.isAvailable ? 'default' : 'secondary'}>
                                            {dish.isAvailable ? 'זמין' : 'לא זמין'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{dish.orderCount}</TableCell>
                                    <TableCell>
                                        {format(new Date(dish.createdAt), 'dd/MM/yyyy', { locale: he })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Link href={`/dishes/${dish.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/dishes/${dish.id}/edit`}>
                                                <Button variant="ghost" size="sm">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {dishes.length === 0 && (
                        <div className="text-center py-8">
                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium">אין מנות</h3>
                            <p className="text-muted-foreground mb-4">
                                התחל בהוספת המנה הראשונה שלך
                            </p>
                            <Link href="/dishes/new">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    הוסף מנה
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}