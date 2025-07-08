// src/app/(dashboard)/dashboard/page.tsx
import { Suspense } from 'react'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'

export const metadata = {
    title: 'לוח בקרה | Amos Kitchen',
    description: 'לוח בקרה למערכת ניהול הזמנות אוכל',
}

export default function DashboardPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardContent />
            </Suspense>
        </div>
    )
}
