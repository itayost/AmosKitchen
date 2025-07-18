// components/customers/customer-grid.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Phone, Mail, MapPin, ShoppingCart, Edit, Trash2, MoreVertical, Eye, AlertTriangle } from 'lucide-react'
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
import { PreferenceBadgeGroup } from './preference-badge'
import type { Customer, CustomerPreference } from '@/lib/types/database'

interface CustomerWithStats extends Customer {
    orderCount: number
    totalSpent: number
    lastOrderDate?: Date
    preferences?: CustomerPreference[]
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

    const hasCriticalPreferences = (preferences?: CustomerPreference[]) => {
        if (!preferences) return false
        return preferences.some(pref => pref.type === 'ALLERGY' || pref.type === 'MEDICAL')
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => {
                const status = getCustomerStatus(customer.orderCount, customer.lastOrderDate)
                const hasCritical = hasCriticalPreferences(customer.preferences)

                return (
                    <Card
                        key={customer.id}
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handleViewProfile(customer.id)}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg">{customer.name}</CardTitle>
                                        {hasCritical && (
                                            <AlertTriangle className="h-4 w-4 text-destructive" />
                                        )}
                                    </div>
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
                            </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="space-y-3">
                                {/* Contact Info */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="font-medium">{customer.phone}</span>
                                    </div>
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

                                {/* Preferences */}
                                {customer.preferences && customer.preferences.length > 0 && (
                                    <div className="pt-2 border-t">
                                        <PreferenceBadgeGroup
                                            preferences={customer.preferences}
                                            maxVisible={3}
                                            showIcon={true}
                                            className="mt-2"
                                        />
                                    </div>
                                )}

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                                    <div>
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <ShoppingCart className="h-3.5 w-3.5" />
                                            <span className="text-xs">הזמנות</span>
                                        </div>
                                        <p className="text-lg font-semibold">{customer.orderCount}</p>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">סה&quot;כ</div>
                                        <p className="text-lg font-semibold text-green-600">
                                            {formatCurrency(customer.totalSpent)}
                                        </p>
                                    </div>
                                </div>

                                {/* Last Order */}
                                {customer.lastOrderDate && (
                                    <div className="text-xs text-muted-foreground pt-2 border-t">
                                        הזמנה אחרונה: {format(new Date(customer.lastOrderDate), 'dd/MM/yyyy', { locale: he })}
                                    </div>
                                )}

                                {/* Notes */}
                                {customer.notes && (
                                    <div className="text-xs text-muted-foreground italic pt-2 border-t line-clamp-2">
                                        {customer.notes}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
