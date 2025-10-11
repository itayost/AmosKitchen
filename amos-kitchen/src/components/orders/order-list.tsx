// components/orders/order-list.tsx
'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import {
    ChevronLeft,
    ChevronRight,
    Edit,
    Trash2,
    Eye,
    ChevronUp,
    ChevronDown,
    MoreVertical,
    AlertTriangle
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
import { Badge } from '@/components/ui/badge'
import { OrderStatusBadge } from './order-status-badge'
import { PreferenceBadgeGroup } from '@/components/customers/preference-badge'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus, Customer, CustomerPreference } from '@/lib/types/database'

interface OrderListProps {
    orders: Order[]
    isLoading: boolean
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    onRefresh: () => void
}

interface OrderWithCustomer extends Order {
    customer: Customer & {
        preferences?: CustomerPreference[]
    }
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
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    // Cast orders to include customer with preferences
    const ordersWithCustomer = orders as OrderWithCustomer[]

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const toggleRowExpansion = (orderId: string) => {
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId)
        } else {
            newExpanded.add(orderId)
        }
        setExpandedRows(newExpanded)
    }

    const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
        try {
            console.log(`Updating order ${orderId} status to ${newStatus}`)

            const response = await fetchWithAuth(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
                console.error('API error response:', errorData)
                throw new Error(errorData.message || `Server error: ${response.status}`)
            }

            const responseData = await response.json()
            console.log('Status update response:', responseData)

            onRefresh()
        } catch (error) {
            console.error('Failed to update status:', error)
        }
    }

    const handleDelete = async (orderId: string) => {
        if (confirm('האם אתה בטוח שברצונך למחוק הזמנה זו?')) {
            try {
                const response = await fetchWithAuth(`/api/orders/${orderId}`, {
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

    const sortedOrders = [...ordersWithCustomer].sort((a, b) => {
        let aValue: any = a[sortField as keyof Order]
        let bValue: any = b[sortField as keyof Order]

        if (sortField === 'customer') {
            aValue = a.customer?.name || ''
            bValue = b.customer?.name || ''
        }

        if (aValue instanceof Date) aValue = aValue.getTime()
        if (bValue instanceof Date) bValue = bValue.getTime()

        if (typeof aValue === 'string') {
            return sortDirection === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue)
        }

        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    })

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS'
        }).format(amount)
    }

    const hasCriticalPreferences = (preferences?: CustomerPreference[]) => {
        if (!preferences) return false
        return preferences.some(p => p.type === 'ALLERGY' || p.type === 'MEDICAL')
    }

    const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => handleSort(field)}
        >
            {children}
            {sortField === field ? (
                sortDirection === 'asc' ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />
            ) : null}
        </Button>
    )

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">טוען הזמנות...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>
                                    <SortButton field="orderNumber">מס׳ הזמנה</SortButton>
                                </TableHead>
                                <TableHead>
                                    <SortButton field="customer">לקוח</SortButton>
                                </TableHead>
                                <TableHead>
                                    <SortButton field="deliveryDate">תאריך משלוח</SortButton>
                                </TableHead>
                                <TableHead>
                                    <SortButton field="status">סטטוס</SortButton>
                                </TableHead>
                                <TableHead className="text-right">
                                    <SortButton field="totalAmount">סכום</SortButton>
                                </TableHead>
                                <TableHead className="w-[100px]">פעולות</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedOrders.map((order) => (
                                <>
                                    <TableRow
                                        key={order.id}
                                        className={cn(
                                            "cursor-pointer hover:bg-muted/50",
                                            hasCriticalPreferences(order.customer?.preferences) && "bg-red-50/30"
                                        )}
                                    >
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleRowExpansion(order.id)}
                                            >
                                                {expandedRows.has(order.id) ?
                                                    <ChevronUp className="h-4 w-4" /> :
                                                    <ChevronDown className="h-4 w-4" />
                                                }
                                            </Button>
                                        </TableCell>
                                        <TableCell
                                            className="font-medium"
                                            onClick={() => router.push(`/orders/${order.id}`)}
                                        >
                                            {order.orderNumber}
                                        </TableCell>
                                        <TableCell onClick={() => router.push(`/orders/${order.id}`)}>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span>{order.customer?.name || 'לקוח לא ידוע'}</span>
                                                    {hasCriticalPreferences(order.customer?.preferences) && (
                                                        <Badge variant="destructive" className="h-4 px-1">
                                                            <AlertTriangle className="h-3 w-3" />
                                                        </Badge>
                                                    )}
                                                </div>
                                                {order.customer?.preferences && order.customer.preferences.length > 0 && (
                                                    <PreferenceBadgeGroup
                                                        preferences={order.customer.preferences}
                                                        maxVisible={2}
                                                        showIcon={false}
                                                        className="mt-1"
                                                    />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell onClick={() => router.push(`/orders/${order.id}`)}>
                                            {format(new Date(order.deliveryDate), 'dd/MM/yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <OrderStatusBadge status={order.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(Number(order.totalAmount))}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    <DropdownMenuLabel>פעולות</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}`)}>
                                                        <Eye className="h-4 w-4 ml-2" />
                                                        צפייה
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}/edit`)}>
                                                        <Edit className="h-4 w-4 ml-2" />
                                                        עריכה
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleDelete(order.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 ml-2" />
                                                        מחיקה
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>

                                    {/* Expanded Row - Show Preferences */}
                                    {expandedRows.has(order.id) && order.customer?.preferences && order.customer.preferences.length > 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="bg-muted/30">
                                                <div className="p-4 space-y-3">
                                                    <h4 className="text-sm font-semibold">העדפות לקוח:</h4>
                                                    <PreferenceBadgeGroup
                                                        preferences={order.customer.preferences}
                                                        maxVisible={20}
                                                        showIcon={true}
                                                    />
                                                    {order.customer.preferences.some(p => p.notes) && (
                                                        <div className="mt-2 space-y-1">
                                                            {order.customer.preferences
                                                                .filter(p => p.notes)
                                                                .map(p => (
                                                                    <p key={p.id} className="text-sm text-muted-foreground">
                                                                        • {p.value}: {p.notes}
                                                                    </p>
                                                                ))
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    עמוד {currentPage} מתוך {totalPages}
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronRight className="h-4 w-4" />
                        הקודם
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        הבא
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
