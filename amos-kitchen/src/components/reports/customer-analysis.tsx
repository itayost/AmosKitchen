// src/components/reports/customer-analysis.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Crown, ShoppingCart, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface CustomerData {
    customer: {
        id: string
        name: string
        phone: string
        email?: string
    }
    orderCount: number
    totalSpent: number
    favoritesDishes: Array<{ dish: string; count: number }>
}

interface CustomerAnalysisProps {
    customers: CustomerData[]
}

export function CustomerAnalysis({ customers }: CustomerAnalysisProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS',
            minimumFractionDigits: 0
        }).format(value)
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const getCustomerRank = (index: number) => {
        switch (index) {
            case 0:
                return { icon: Crown, color: 'text-yellow-500', label: 'לקוח מוביל' }
            case 1:
                return { icon: TrendingUp, color: 'text-silver-500', label: 'לקוח כסף' }
            case 2:
                return { icon: TrendingUp, color: 'text-bronze-500', label: 'לקוח ארד' }
            default:
                return null
        }
    }

    return (
        <div className="grid gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>לקוחות מובילים</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {customers.map((customer, index) => {
                            const rank = getCustomerRank(index)
                            return (
                                <div 
                                    key={customer.customer.id} 
                                    className="flex items-start justify-between p-4 rounded-lg border"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="relative">
                                            <Avatar>
                                                <AvatarFallback>
                                                    {getInitials(customer.customer.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {rank && (
                                                <rank.icon 
                                                    className={`absolute -top-1 -right-1 h-4 w-4 ${rank.color}`} 
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <Link 
                                                href={`/customers/${customer.customer.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {customer.customer.name}
                                            </Link>
                                            <p className="text-sm text-muted-foreground">
                                                {customer.customer.phone}
                                            </p>
                                            {rank && (
                                                <Badge variant="secondary" className="mt-1 text-xs">
                                                    {rank.label}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{customer.orderCount} הזמנות</span>
                                        </div>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatCurrency(customer.totalSpent)}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>מנות מועדפות לפי לקוח</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {customers.slice(0, 5).map((customer) => (
                            <div key={customer.customer.id} className="space-y-2">
                                <p className="font-medium">{customer.customer.name}</p>
                                <div className="flex flex-wrap gap-2">
                                    {customer.favoritesDishes.map((dish, index) => (
                                        <Badge 
                                            key={index} 
                                            variant={index === 0 ? 'default' : 'secondary'}
                                        >
                                            {dish.dish} ({dish.count})
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
