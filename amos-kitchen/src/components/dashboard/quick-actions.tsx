// src/components/dashboard/quick-actions.tsx
'use client'

import { Plus, FileText, ShoppingCart, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function QuickActions() {
    const router = useRouter()

    const actions = [
        {
            label: 'הזמנה חדשה',
            icon: ShoppingCart,
            href: '/orders/new',
            description: 'צור הזמנה חדשה',
            color: 'text-blue-600'
        },
        {
            label: 'לקוח חדש',
            icon: Users,
            href: '/customers/new',
            description: 'הוסף לקוח חדש',
            color: 'text-green-600'
        },
        {
            label: 'דוח שבועי',
            icon: FileText,
            href: '/reports/weekly',
            description: 'צפה בדוח השבועי',
            color: 'text-purple-600'
        },
        {
            label: 'ניתוח לקוחות',
            icon: FileText,
            href: '/reports/analytics',
            description: 'צפה בניתוח לקוחות',
            color: 'text-orange-600'
        }
    ]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button>
                    <Plus className="ml-2 h-4 w-4" />
                    פעולות מהירות
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>פעולות מהירות</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {actions.map((action) => {
                    const Icon = action.icon
                    return (
                        <DropdownMenuItem
                            key={action.href}
                            onClick={() => router.push(action.href)}
                            className="cursor-pointer"
                        >
                            <Icon className={`ml-2 h-4 w-4 ${action.color}`} />
                            <div className="flex-1">
                                <div className="font-medium">{action.label}</div>
                                <div className="text-xs text-muted-foreground">
                                    {action.description}
                                </div>
                            </div>
                        </DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
