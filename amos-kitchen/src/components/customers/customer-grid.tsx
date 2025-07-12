// components/customers/customer-grid.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Phone, Mail, MapPin, ShoppingCart, Edit, Trash2, MoreVertical, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface CustomerGridProps {
    customers: CustomerWithStats[]
    onEdit: (customer: Customer) => void
    onDelete: (customerId: string) => void
}

export function CustomerGrid({ customers, onEdit, onDelete }: CustomerGridProps) {
    const router = useRouter()

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

    const handleViewProfile = (customerId: string) => {
        router.push(`/customers/${customerId}`)
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => {
                const status = getCustomerStatus(customer.orderCount, customer.lastOrderDate)

                return (
                    <Card
                        key={customer.id}
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handleViewProfile(customer.id)}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                                    <Badge variant={status.variant} className="mt-1">
                                        {status.label}
                                    </Badge>
                                </div>
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
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleViewProfile(customer.id)}>
                                            <Eye className="ml-2 h-4 w-4" />
                                            הצג פרופיל
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onEdit(customer)}>
                                            <Edit className="ml-2 h-4 w-4" />
                                            ערוך
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onDelete(customer.id)}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="ml-2 h-4 w-4" />
                                            מחק
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4 space-y-3">
                            <div className="space-y-2 text-sm">
                                {customer.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>{customer.phone}</span>
                                    </div>
                                )}
                                {customer.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="truncate">{customer.email}</span>
                                    </div>
                                )}
                                {customer.address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="truncate">{customer.address}</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                                <div>
                                    <p className="text-xs text-muted-foreground">הזמנות</p>
                                    <p className="text-sm font-semibold">{customer.orderCount}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">סה&quot;כ</p>
                                    <p className="text-sm font-semibold">{formatCurrency(customer.totalSpent)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
