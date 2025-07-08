// components/customers/customer-list.tsx
'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { Edit, Trash2, MoreVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

type SortField = 'name' | 'orderCount' | 'totalSpent' | 'lastOrderDate' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export function CustomerList({ customers, onEdit, onDelete }: CustomerListProps) {
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

    const sortedCustomers = [...customers].sort((a, b) => {
        let aValue: any = a[sortField]
        let bValue: any = b[sortField]

        // Handle date sorting
        if (sortField === 'lastOrderDate' || sortField === 'createdAt') {
            aValue = aValue ? new Date(aValue).getTime() : 0
            bValue = bValue ? new Date(bValue).getTime() : 0
        }

        // Handle string sorting
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase()
            bValue = bValue.toLowerCase()
        }

        if (sortDirection === 'asc') {
            return aValue > bValue ? 1 : -1
        } else {
            return aValue < bValue ? 1 : -1
        }
    })

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

    const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 lg:px-3"
            onClick={() => handleSort(field)}
        >
            {children}
            {sortField === field && (
                sortDirection === 'asc' ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />
            )}
        </Button>
    )

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-right">
                            <SortButton field="name">שם הלקוח</SortButton>
                        </TableHead>
                        <TableHead className="text-right">טלפון</TableHead>
                        <TableHead className="text-right hidden md:table-cell">כתובת</TableHead>
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
                            <TableRow key={customer.id}>
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
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>פעולות</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => onEdit(customer)}>
                                                <Edit className="ml-2 h-4 w-4" />
                                                ערוך פרטים
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => onDelete(customer.id)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="ml-2 h-4 w-4" />
                                                מחק לקוח
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
