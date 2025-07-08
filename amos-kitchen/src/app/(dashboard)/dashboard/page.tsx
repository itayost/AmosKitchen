// app/(dashboard)/dashboard/page.tsx
import { Suspense } from 'react';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';

export const metadata = {
    title: 'Dashboard | Amos Kitchen',
    description: 'Food ordering system dashboard',
};

export default function DashboardPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>
            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardContent />
            </Suspense>
        </div>
    );
}
