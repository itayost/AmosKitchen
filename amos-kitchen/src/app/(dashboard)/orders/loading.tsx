// app/(dashboard)/orders/loading.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function OrdersLoading() {
    return (
        <div className="p-6 space-y-6" dir="rtl">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
                <Skeleton className="h-9 w-32" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters Skeleton */}
            <div className="flex flex-col md:flex-row gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-[180px]" />
                <Skeleton className="h-10 w-[180px]" />
            </div>

            {/* Table Skeleton */}
            <Card>
                <CardContent className="p-0">
                    <div className="p-4">
                        {/* Table Header */}
                        <div className="grid grid-cols-6 gap-4 mb-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-6" />
                            ))}
                        </div>
                        {/* Table Rows */}
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-6 gap-4 py-4 border-t">
                                <Skeleton className="h-4" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4" />
                                    <Skeleton className="h-3 w-3/4" />
                                </div>
                                <Skeleton className="h-4" />
                                <Skeleton className="h-4" />
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-8 w-8" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Pagination Skeleton */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-10" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-10" />
                    ))}
                    <Skeleton className="h-10 w-10" />
                </div>
            </div>
        </div>
    )
}
