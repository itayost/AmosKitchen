// app/(dashboard)/orders/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { OrderFilters } from '@/components/orders/order-filters'
import { OrderList } from '@/components/orders/order-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Plus } from 'lucide-react'
import { useOrders } from '@/lib/hooks/use-orders'
import { exportOrdersToExcel } from '@/lib/utils/export'
import Link from 'next/link'
import type { OrderFilters as OrderFiltersType } from '@/lib/types/database'

export default function OrdersPage() {
    const [filters, setFilters] = useState<OrderFiltersType>({
        search: '',
        status: 'all',
        dateRange: 'all',
        page: 1,
        limit: 10
    })

    const { orders, isLoading, totalCount, refetch } = useOrders(filters)

    const handleExport = async () => {
        try {
            const response = await fetch(`/api/orders/export?${new URLSearchParams({
                search: filters.search,
                status: filters.status,
                dateRange: filters.dateRange
            })}`)

            const data = await response.json()
            exportOrdersToExcel(data.orders)
        } catch (error) {
            console.error('Export failed:', error)
        }
    }

    const stats = {
        total: totalCount || 0,
        new: orders?.filter(o => o.status === 'new').length || 0,
        preparing: orders?.filter(o => o.status === 'preparing').length || 0,
        delivered: orders?.filter(o => {
            const today = new Date()
            const orderDate = new Date(o.deliveryDate)
            return o.status === 'delivered' &&
                orderDate.toDateString() === today.toDateString()
        }).length || 0
    }

    return (
        <div className="p-6 space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">ניהול הזמנות</h1>
                <div className="flex gap-2">
                    <Button onClick={handleExport} variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        ייצוא לאקסל
                    </Button>
                    <Link href="/orders/new">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            הזמנה חדשה
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            סה&quot;כ הזמנות
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            הזמנות חדשות
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            בהכנה
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.preparing}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            נמסרו היום
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <OrderFilters
                filters={filters}
                onFiltersChange={setFilters}
            />

            {/* Orders Table */}
            <OrderList
                orders={orders || []}
                isLoading={isLoading}
                currentPage={filters.page}
                totalPages={Math.ceil((totalCount || 0) / filters.limit)}
                onPageChange={(page) => setFilters({ ...filters, page })}
                onRefresh={refetch}
            />
        </div>
    )
}
