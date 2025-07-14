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
import { PreferenceBadgeGroup } from './preference-badge'
import type { Customer, CustomerPreference } from '@/lib/types/database'

interface CustomerWithStats extends Customer {
    orderCount: number
    totalSpent: number
    lastOrderDate?: Date
    preferences?: CustomerPreference[]
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

    const getCustomerStatus = (orderCount: number, lastOrderDate?: Date | null) => {
        if (orderCount === 0) return { label: 'לקוח חדש', variant: 'secondary' as const }
        if (orderCount > 5) return { label: 'לקוח מועדף', variant: 'default' as const }
        if (orderCount > 2) return { label: 'לקוח פעיל', variant: 'default' as const }
        return { label: 'לקוח רגיל', variant: 'secondary' as const }
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

    const hasCriticalPreferences = (preferences?: CustomerPreference[]) => {
        if (!preferences) return false
        return preferences.some(pref => pref.type === 'ALLERGY' || pref.type === 'MEDICAL')
    }

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
                        <TableHead>העדפות</TableHead>
                        <TableHead className="text-center">סטטוס</TableHead>
                        <TableHead className="text-center">
                            <SortButton field="orderCount">הזמנות</SortButton>
                        </TableHead>
                        <TableHead className="text-right">
                            <SortButton field="totalSpent">סה&quot;כ</SortButton>
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
                        const hasCritical = hasCriticalPreferences(customer.preferences)

                        return (
                            <TableRow
                                key={customer.id}
                                className="hover:bg-muted/50 cursor-pointer"
                                onClick={() => handleViewProfile(customer.id)}
                            >
                                <TableCell className="font-medium">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {customer.name}
                                            {hasCritical && (
                                                <Badge variant="destructive" className="h-5 px-1">
                                                    !
                                                </Badge>
                                            )}
                                        </div>
                                        {customer.email && (
                                            <div className="text-sm text-muted-foreground">{customer.email}</div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">{customer.phone}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {customer.address || '-'}
                                </TableCell>
                                <TableCell>
                                    <PreferenceBadgeGroup
                                        preferences={customer.preferences || []}
                                        maxVisible={2}
                                        showIcon={false}
                                    />
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
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                                <span className="sr-only">פתח תפריט</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            <DropdownMenuLabel>פעולות</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleViewProfile(customer.id)}>
                                                <Eye className="h-4 w-4 ml-2" />
                                                צפייה בפרופיל
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onEdit(customer)}>
                                                <Edit className="h-4 w-4 ml-2" />
                                                עריכה
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => onDelete(customer.id)}
                                                className="text-destructive focus:text-destructive"
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
