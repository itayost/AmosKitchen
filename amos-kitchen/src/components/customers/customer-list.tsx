// components/customers/customer-list.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, Trash2, MoreVertical, ArrowUpDown, Eye } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import type { Customer } from '@/lib/types/database'

interface CustomerWithStats extends Customer {
    orderCount: number
    totalSpent: number
    lastOrderDate?: Date
}

interface CustomerListProps {
    customers: CustomerWithStats[]
    onEdit: (customer: Customer) => void
    onDelete: (customerId: string) => void
}

type SortField = 'name' | 'orderCount' | 'totalSpent' | 'lastOrderDate'
type SortOrder = 'asc' | 'desc'

export function CustomerList({ customers, onEdit, onDelete }: CustomerListProps) {
    const router = useRouter()
    const [sortField, setSortField] = useState<SortField>('name')
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS'
        }).format(amount)
    }

    const getCustomerStatus = (orderCount: number, lastOrderDate?: Date) => {
        if (!lastOrderDate) return { label: 'לקוח חדש', variant: 'default' as const }

        const daysSinceLastOrder = Math.floor(
            (new Date().getTime() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysSinceLastOrder < 30) {
            return { label: 'פעיל', variant: 'success' as const }
        } else if (daysSinceLastOrder < 90) {
            return { label: 'לא פעיל', variant: 'warning' as const }
        } else {
            return { label: 'רדום', variant: 'secondary' as const }
        }
    }

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('asc')
        }
    }

    const sortedCustomers = [...customers].sort((a, b) => {
        let aValue = a[sortField]
        let bValue = b[sortField]

        if (sortField === 'lastOrderDate') {
            aValue = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0
            bValue = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortOrder === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue)
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
        }

        return 0
    })

    const handleViewProfile = (customerId: string) => {
        router.push(`/customers/${customerId}`)
    }

    const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 lg:px-3"
            onClick={() => handleSort(field)}
        >
            {children}
            <ArrowUpDown className="mr-2 h-4 w-4" />
        </Button>
    )

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>
                            <SortButton field="name">שם הלקוח</SortButton>
                        </TableHead>
                        <TableHead className="text-right">טלפון</TableHead>
                        <TableHead className="hidden md:table-cell">כתובת</TableHead>
                        <TableHead className="text-center">סטטוס</TableHead>
                        <TableHead className="text-center">
                            <SortButton field="orderCount">הזמנות</SortButton>
                        </TableHead>
                        <TableHead className="text-right">
                            <SortButton field="totalSpent">סה"כ</SortButton>
                        </TableHead>
                        <TableHead className="text-right hidden lg:table-cell">
                            <SortButton field="lastOrderDate">הזמנה אחרונה</SortButton>
                        </TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedCustomers.map((customer) => {
                        const status = getCustomerStatus(customer.orderCount, customer.lastOrderDate)

                        return (
                            <TableRow
                                key={customer.id}
                                className="hover:bg-muted/50 cursor-pointer"
                                onClick={() => handleViewProfile(customer.id)}
                            >
                                <TableCell className="font-medium">
                                    <div>
                                        <div>{customer.name}</div>
                                        {customer.email && (
                                            <div className="text-sm text-muted-foreground">{customer.email}</div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">{customer.phone}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {customer.address || '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                </TableCell>
                                <TableCell className="text-center">{customer.orderCount}</TableCell>
                                <TableCell className="text-right">{formatCurrency(customer.totalSpent)}</TableCell>
                                <TableCell className="text-right hidden lg:table-cell">
                                    {customer.lastOrderDate
                                        ? format(new Date(customer.lastOrderDate), 'dd/MM/yyyy', { locale: he })
                                        : '-'
                                    }
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>פעולות</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleViewProfile(customer.id)}>
                                                <Eye className="h-4 w-4 ml-2" />
                                                צפייה בפרופיל
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onEdit(customer)}>
                                                <Edit className="h-4 w-4 ml-2" />
                                                עריכה מהירה
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => onDelete(customer.id)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 ml-2" />
                                                מחיקה
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
