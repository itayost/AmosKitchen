// src/app/(dashboard)/orders/new/page.tsx
import { Suspense } from 'react'
import { OrderForm } from '@/components/orders/order-form'
import { getCustomers } from '@/lib/firebase/dao/customers'
import { getAvailableDishes } from '@/lib/firebase/dao/dishes'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

async function getFormData() {
    try {
        // Fetch customers and dishes from Firestore
        const [customersResult, dishesData] = await Promise.all([
            getCustomers(undefined, 100), // Get up to 100 customers
            getAvailableDishes()
        ])

        // Serialize the data to ensure proper client-side handling
        const customers = customersResult.customers.map(customer => ({
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email || '',
            address: customer.address || '',
            notes: customer.notes || '',
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt
        })).sort((a, b) => a.name.localeCompare(b.name))

        const dishes = dishesData.map(dish => ({
            id: dish.id,
            name: dish.name,
            description: dish.description || '',
            price: Number(dish.price),
            category: dish.category?.toLowerCase() || 'main',
            isAvailable: dish.isAvailable,
            createdAt: dish.createdAt,
            updatedAt: dish.updatedAt
        })).sort((a, b) => a.name.localeCompare(b.name))

        return { customers, dishes }
    } catch (error) {
        console.error('Database error:', error)
        // Return empty arrays as fallback
        return { customers: [], dishes: [] }
    }
}

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

export default async function NewOrderPage() {
    const { customers, dishes } = await getFormData()

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
                                <Link href="/customers/new">
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
            <Suspense fallback={<LoadingSkeleton />}>
                <OrderForm customers={customers} dishes={dishes} />
            </Suspense>
        </div>
    )
}
