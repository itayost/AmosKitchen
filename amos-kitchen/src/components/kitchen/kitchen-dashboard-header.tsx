'use client'

import { RefreshCw, ClipboardList, ChefHat, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

interface KitchenDashboardHeaderProps {
  deliveryDate?: Date | null
  orderCount: number
  viewMode: 'orders' | 'dishes'
  onViewModeChange: (mode: 'orders' | 'dishes') => void
  isRefreshing: boolean
  onRefresh: () => void
}

export function KitchenDashboardHeader({
  deliveryDate,
  orderCount,
  viewMode,
  onViewModeChange,
  isRefreshing,
  onRefresh
}: KitchenDashboardHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">לוח מטבח</h1>
          {deliveryDate && (
            <div className="flex items-center gap-2 mt-2 text-lg text-muted-foreground">
              <Calendar className="h-5 w-5" />
              <span>הזמנות ליום {format(new Date(deliveryDate), 'EEEE, d בMMMM yyyy', { locale: he })}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            {orderCount} הזמנות פעילות
          </Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 bg-white p-1 rounded-lg border w-fit">
        <Button
          variant={viewMode === 'orders' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('orders')}
          className="flex items-center gap-2"
        >
          <ClipboardList className="h-4 w-4" />
          תצוגת הזמנות
        </Button>
        <Button
          variant={viewMode === 'dishes' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('dishes')}
          className="flex items-center gap-2"
        >
          <ChefHat className="h-4 w-4" />
          תצוגת מנות
        </Button>
      </div>
    </div>
  )
}
