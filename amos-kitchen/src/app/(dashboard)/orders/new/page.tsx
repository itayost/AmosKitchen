// app/(dashboard)/orders/new/page.tsx
import { Suspense } from 'react'
import { OrderForm } from '@/components/orders/order-form'
import { prisma } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

async function getFormData() {
    try {
        const [customers, dishes] = await Promise.all([
            prisma.customer.findMany({
                orderBy: { name: 'asc' }
            }),
            prisma.dish.findMany({
                where: { isAvailable: true },
                orderBy: { name: 'asc' }
            })
        ])

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

            {/* Order Form */}
            <Suspense fallback={<LoadingSkeleton />}>
                <OrderForm customers={customers} dishes={dishes} />
            </Suspense>
        </div>
    )
}
