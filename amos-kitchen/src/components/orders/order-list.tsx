// components/orders/order-list.tsx
'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
    ChevronLeft,
    ChevronRight,
    Edit,
    Trash2,
    Eye,
    ChevronUp,
    ChevronDown,
    MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import { OrderStatusBadge } from './order-status-badge'
import { useRouter } from 'next/navigation'
import type { Order, OrderStatus } from '@/lib/types/database'

interface OrderListProps {
    orders: Order[]
    isLoading: boolean
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    onRefresh: () => void
}

type SortField = 'orderNumber' | 'customer' | 'deliveryDate' | 'totalAmount' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export function OrderList({
    orders,
    isLoading,
    currentPage,
    totalPages,
    onPageChange,
    onRefresh
}: OrderListProps) {
    const router = useRouter()
    const [sortField, setSortField] = useState<SortField>('createdAt')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (response.ok) {
                onRefresh()
            }
        } catch (error) {
            console.error('Failed to update status:', error)
        }
    }

    const handleDelete = async (orderId: string) => {
        if (confirm('האם אתה בטוח שברצונך למחוק הזמנה זו?')) {
            try {
                const response = await fetch(`/api/orders/${orderId}`, {
                    method: 'DELETE'
                })

                if (response.ok) {
                    onRefresh()
                }
            } catch (error) {
                console.error('Failed to delete order:', error)
            }
        }
    }

    // Sort orders
    const sortedOrders = [...orders].sort((a, b) => {
        let aValue: any = a[sortField]
        let bValue: any = b[sortField]

        if (sortField === 'customer') {
            aValue = a.customer.name
            bValue = b.customer.name
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
    })

    const SortIndicator = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null
        return sortDirection === 'asc' ?
            <ChevronUp className="h-4 w-4" /> :
            <ChevronDown className="h-4 w-4" />
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8">
                    <div className="flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                            <p className="text-gray-500">טוען הזמנות...</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!orders || orders.length === 0) {
        return (
            <Card>
                <CardContent className="p-8">
                    <div className="text-center text-gray-500">
                        <p>לא נמצאו הזמנות</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort('orderNumber')}
                                >
                                    <div className="flex items-center gap-1">
                                        מספר הזמנה
                                        <SortIndicator field="orderNumber" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort('customer')}
                                >
                                    <div className="flex items-center gap-1">
                                        לקוח
                                        <SortIndicator field="customer" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort('deliveryDate')}
                                >
                                    <div className="flex items-center gap-1">
                                        תאריך משלוח
                                        <SortIndicator field="deliveryDate" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort('totalAmount')}
                                >
                                    <div className="flex items-center gap-1">
                                        סכום
                                        <SortIndicator field="totalAmount" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-1">
                                        סטטוס
                                        <SortIndicator field="status" />
                                    </div>
                                </TableHead>
                                <TableHead>פעולות</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">
                                        {order.orderNumber}
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{order.customer.name}</div>
                                            <div className="text-sm text-muted-foreground">{order.customer.phone}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(order.deliveryDate), 'dd/MM/yyyy')}
                                    </TableCell>
                                    <TableCell>₪{order.totalAmount}</TableCell>
                                    <TableCell>
                                        <OrderStatusBadge status={order.status} />
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => router.push(`/orders/${order.id}`)}
                                                    className="gap-2"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    צפייה
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => router.push(`/orders/${order.id}/edit`)}
                                                    className="gap-2"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    עריכה
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel>שנה סטטוס</DropdownMenuLabel>
                                                {(['new', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'] as OrderStatus[]).map((status) => (
                                                    <DropdownMenuItem
                                                        key={status}
                                                        onClick={() => handleStatusUpdate(order.id, status)}
                                                        disabled={order.status === status}
                                                    >
                                                        {status === 'new' && 'חדש'}
                                                        {status === 'confirmed' && 'אושר'}
                                                        {status === 'preparing' && 'בהכנה'}
                                                        {status === 'ready' && 'מוכן'}
                                                        {status === 'delivered' && 'נמסר'}
                                                        {status === 'cancelled' && 'בוטל'}
                                                    </DropdownMenuItem>
                                                ))}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="gap-2 text-red-600"
                                                    onClick={() => handleDelete(order.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    מחיקה
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    מציג {((currentPage - 1) * 10) + 1} עד {Math.min(currentPage * 10, orders.length)} מתוך {orders.length} תוצאות
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                                pageNum = i + 1
                            } else if (currentPage <= 3) {
                                pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                            } else {
                                pageNum = currentPage - 2 + i
                            }

                            return (
                                <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => onPageChange(pageNum)}
                                    className="w-10"
                                >
                                    {pageNum}
                                </Button>
                            )
                        })}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </>
    )
}
