// src/app/(dashboard)/orders/new/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { OrderForm } from '@/components/orders/order-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { ChevronRight, AlertTriangle, Loader2 } from 'lucide-react'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import type { Customer, Dish } from '@/lib/types/database'

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function NewOrderPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [dishes, setDishes] = useState<Dish[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                setError(null)

                // Fetch customers and dishes in parallel
                const [customersResponse, dishesResponse] = await Promise.all([
                    fetchWithAuth('/api/customers?limit=100'),
                    fetchWithAuth('/api/dishes?available=true')
                ])

                if (!customersResponse.ok) {
                    throw new Error('Failed to fetch customers')
                }

                if (!dishesResponse.ok) {
                    throw new Error('Failed to fetch dishes')
                }

                const customersData = await customersResponse.json()
                const dishesData = await dishesResponse.json()

                // Process and sort customers
                const processedCustomers = customersData
                    .filter((customer: any) => customer.id)
                    .map((customer: any) => ({
                        id: customer.id,
                        name: customer.name,
                        phone: customer.phone,
                        email: customer.email || '',
                        address: customer.address || '',
                        notes: customer.notes || '',
                        preferences: customer.preferences || [],
                        createdAt: customer.createdAt,
                        updatedAt: customer.updatedAt
                    }))
                    .sort((a: Customer, b: Customer) => a.name.localeCompare(b.name))

                // Process and sort dishes
                const processedDishes = dishesData
                    .filter((dish: any) => dish.id && dish.isAvailable)
                    .map((dish: any) => ({
                        id: dish.id,
                        name: dish.name,
                        description: dish.description || '',
                        price: Number(dish.price),
                        category: dish.category?.toLowerCase() || 'main',
                        isAvailable: dish.isAvailable,
                        createdAt: dish.createdAt,
                        updatedAt: dish.updatedAt
                    }))
                    .sort((a: Dish, b: Dish) => a.name.localeCompare(b.name))

                setCustomers(processedCustomers)
                setDishes(processedDishes)
            } catch (err) {
                console.error('Error fetching data:', err)
                setError(err instanceof Error ? err.message : 'Failed to load data')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    if (isLoading) {
        return (
            <div className="space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/dashboard" className="hover:text-foreground">
                        לוח בקרה
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                    <Link href="/orders" className="hover:text-foreground">
                        הזמנות
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-foreground">הזמנה חדשה</span>
                </div>

                {/* Page Title */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">יצירת הזמנה חדשה</h1>
                    <p className="text-muted-foreground">
                        מלא את הפרטים ליצירת הזמנה חדשה. ניתן להזמין למשלוח בימי שישי בלבד.
                    </p>
                </div>

                <LoadingSkeleton />
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/dashboard" className="hover:text-foreground">
                        לוח בקרה
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                    <Link href="/orders" className="hover:text-foreground">
                        הזמנות
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-foreground">הזמנה חדשה</span>
                </div>

                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                            <div>
                                <h3 className="font-semibold text-red-800">שגיאה בטעינת הנתונים</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                                <Button
                                    onClick={() => window.location.reload()}
                                    className="mt-3"
                                    variant="outline"
                                >
                                    נסה שוב
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/dashboard" className="hover:text-foreground">
                    לוח בקרה
                </Link>
                <ChevronRight className="h-4 w-4" />
                <Link href="/orders" className="hover:text-foreground">
                    הזמנות
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">הזמנה חדשה</span>
            </div>

            {/* Page Title */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">יצירת הזמנה חדשה</h1>
                <p className="text-muted-foreground">
                    מלא את הפרטים ליצירת הזמנה חדשה. ניתן להזמין למשלוח בימי שישי בלבד.
                </p>
            </div>

            {/* Show warning if no customers */}
            {customers.length === 0 && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="text-orange-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-orange-800">לא נמצאו לקוחות</h3>
                                <p className="text-sm text-orange-700 mt-1">
                                    יש להוסיף לקוחות למערכת לפני יצירת הזמנה.
                                </p>
                                <Link href="/customers/new?redirect=orders">
                                    <Button className="mt-3" variant="outline">
                                        הוסף לקוח חדש
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Order Form */}
            <OrderForm customers={customers} dishes={dishes} />
        </div>
    )
}