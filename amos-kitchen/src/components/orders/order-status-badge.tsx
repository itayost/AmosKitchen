// components/orders/order-status-badge.tsx
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, Package, Truck, XCircle } from 'lucide-react'
import type { OrderStatus } from '@/lib/types/database'

interface OrderStatusBadgeProps {
    status: OrderStatus
}

const statusConfig: Record<OrderStatus, {
    label: string
    color: string
    icon: React.ElementType
}> = {
    NEW: {
        label: 'חדש',
        color: 'bg-blue-500 hover:bg-blue-600',
        icon: Clock
    },
    CONFIRMED: {
        label: 'אושר',
        color: 'bg-green-500 hover:bg-green-600',
        icon: CheckCircle
    },
    PREPARING: {
        label: 'בהכנה',
        color: 'bg-yellow-500 hover:bg-yellow-600',
        icon: Package
    },
    READY: {
        label: 'מוכן',
        color: 'bg-purple-500 hover:bg-purple-600',
        icon: Package
    },
    DELIVERED: {
        label: 'נמסר',
        color: 'bg-gray-500 hover:bg-gray-600',
        icon: Truck
    },
    CANCELLED: {
        label: 'בוטל',
        color: 'bg-red-500 hover:bg-red-600',
        icon: XCircle
    }
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
    const config = statusConfig[status]
    const Icon = config.icon

    return (
        <Badge
            variant="secondary"
            className={`${config.color} text-white border-0`}
        >
            <Icon className="h-3 w-3 ml-1" />
            {config.label}
        </Badge>
    )
}
