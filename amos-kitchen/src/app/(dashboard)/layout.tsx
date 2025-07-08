// app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { checkAuth } from '@/lib/auth'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await checkAuth()

    if (!session) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
