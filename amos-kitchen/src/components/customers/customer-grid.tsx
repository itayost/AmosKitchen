// components/customers/customer-grid.tsx
'use client'

import { Phone, Mail, MapPin, ShoppingCart, Edit, Trash2, MoreVertical } from 'lucide-react'
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

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => {
                const status = getCustomerStatus(customer.orderCount, customer.lastOrderDate)
                
                return (
                    <Card key={customer.id} className="overflow-hidden">
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
                            </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3">
                            {/* Contact Information */}
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    <span className="font-medium">{customer.phone}</span>
                                </div>
                                
                                {customer.email && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span className="truncate">{customer.email}</span>
                                    </div>
                                )}
                                
                                {customer.address && (
                                    <div className="flex items-start gap-2 text-muted-foreground">
                                        <MapPin className="h-4 w-4 mt-0.5" />
                                        <span className="line-clamp-2">{customer.address}</span>
                                    </div>
                                )}
                            </div>

                            {/* Statistics */}
                            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                                <div>
                                    <p className="text-sm text-muted-foreground">הזמנות</p>
                                    <p className="text-2xl font-bold">{customer.orderCount}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">סה"כ</p>
                                    <p className="text-2xl font-bold">{formatCurrency(customer.totalSpent)}</p>
                                </div>
                            </div>

                            {/* Last Order */}
                            {customer.lastOrderDate && (
                                <div className="pt-3 border-t">
                                    <p className="text-sm text-muted-foreground">הזמנה אחרונה</p>
                                    <p className="text-sm font-medium">
                                        {format(new Date(customer.lastOrderDate), 'dd בMMMM yyyy', { locale: he })}
                                    </p>
                                </div>
                            )}

                            {/* Notes */}
                            {customer.notes && (
                                <div className="pt-3 border-t">
                                    <p className="text-sm text-muted-foreground">הערות</p>
                                    <p className="text-sm line-clamp-2">{customer.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
