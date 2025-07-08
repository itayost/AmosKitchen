// src/components/dashboard/recent-activity.tsx
'use client'

import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { 
    ShoppingCart, 
    UserPlus, 
    Package, 
    CheckCircle, 
    XCircle,
    Clock,
    TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface Activity {
    id: string
    action: string
    details: any
    createdAt: string
    order?: {
        id: string
        orderNumber: string
        customer: {
            name: string
        }
    }
}

interface RecentActivityProps {
    activities: Activity[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
    const getActivityIcon = (action: string) => {
        switch (action) {
            case 'order_created':
                return { icon: ShoppingCart, color: 'text-blue-600' }
            case 'status_change':
                return { icon: Clock, color: 'text-yellow-600' }
            case 'order_completed':
                return { icon: CheckCircle, color: 'text-green-600' }
            case 'order_cancelled':
                return { icon: XCircle, color: 'text-red-600' }
            case 'customer_created':
                return { icon: UserPlus, color: 'text-purple-600' }
            default:
                return { icon: Package, color: 'text-gray-600' }
        }
    }

    const getActivityMessage = (activity: Activity) => {
        switch (activity.action) {
            case 'order_created':
                return `הזמנה חדשה #${activity.order?.orderNumber} נוצרה עבור ${activity.order?.customer.name}`
            case 'status_change':
                return `סטטוס הזמנה #${activity.order?.orderNumber} שונה ל-${getStatusLabel(activity.details.newStatus)}`
            case 'order_completed':
                return `הזמנה #${activity.order?.orderNumber} הושלמה ונמסרה`
            case 'order_cancelled':
                return `הזמנה #${activity.order?.orderNumber} בוטלה`
            case 'customer_created':
                return `לקוח חדש נוסף: ${activity.details.customerName}`
            case 'item_added':
                return `${activity.details.dishName} נוסף להזמנה #${activity.order?.orderNumber}`
            case 'item_removed':
                return `${activity.details.dishName} הוסר מהזמנה #${activity.order?.orderNumber}`
            default:
                return activity.details.message || 'פעילות חדשה'
        }
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            new: 'חדש',
            confirmed: 'מאושר',
            preparing: 'בהכנה',
            ready: 'מוכן',
            delivered: 'נמסר',
            cancelled: 'בוטל'
        }
        return labels[status.toLowerCase()] || status
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    פעילות אחרונה
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                        {activities.map((activity) => {
                            const { icon: Icon, color } = getActivityIcon(activity.action)
                            return (
                                <div key={activity.id} className="flex gap-3">
                                    <div className={`mt-0.5 ${color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm leading-relaxed">
                                            {getActivityMessage(activity)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(activity.createdAt), {
                                                addSuffix: true,
                                                locale: he
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                        {activities.length === 0 && (
                            <p className="text-center py-8 text-muted-foreground">
                                אין פעילות להצגה
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
