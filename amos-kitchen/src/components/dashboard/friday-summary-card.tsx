'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ChefHat, Plus, Package, Wallet, Calendar } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { formatPrice } from '@/lib/utils'

interface FridaySummaryCardProps {
  fridayData: {
    date: Date
    orderCount: number
    dishCount: number
    revenue: number
    status: 'open' | 'cutoff-soon' | 'closed'
  }
  preparationProgress?: {
    pending: number
    preparing: number
    ready: number
    delivered: number
  }
}

const statusConfig = {
  open: { variant: 'default' as const, label: 'פתוח להזמנות' },
  'cutoff-soon': { variant: 'secondary' as const, label: 'נסגר בקרוב' },
  closed: { variant: 'destructive' as const, label: 'סגור' }
}

export function FridaySummaryCard({ fridayData, preparationProgress }: FridaySummaryCardProps) {
  const dateStr = format(fridayData.date, 'EEEE, d בMMMM', { locale: he })
  const config = statusConfig[fridayData.status]

  const totalOrders = preparationProgress
    ? preparationProgress.pending + preparationProgress.preparing + preparationProgress.ready + preparationProgress.delivered
    : fridayData.orderCount

  const completedOrders = preparationProgress
    ? preparationProgress.ready + preparationProgress.delivered
    : 0

  const progressPercent = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ChefHat className="h-5 w-5 text-orange-600" />
            יום שישי הקרוב
          </CardTitle>
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        </div>
        <p className="text-sm font-medium text-muted-foreground">{dateStr}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <StatItem
            icon={<Package className="h-4 w-4" />}
            value={fridayData.orderCount}
            label="הזמנות"
          />
          <StatItem
            icon={<ChefHat className="h-4 w-4" />}
            value={fridayData.dishCount}
            label="מנות"
          />
          <StatItem
            icon={<Wallet className="h-4 w-4" />}
            value={formatPrice(fridayData.revenue)}
            label="הכנסות"
          />
        </div>

        {/* Preparation Progress */}
        {preparationProgress && totalOrders > 0 && (
          <div className="space-y-2 pt-2 border-t border-orange-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-900 font-medium">התקדמות הכנה</span>
              <span className="text-orange-700">
                {completedOrders} / {totalOrders} מוכנות
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="text-center">
                <div className="font-bold text-orange-900">{preparationProgress.pending}</div>
                <div className="text-orange-700">ממתין</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-orange-900">{preparationProgress.preparing}</div>
                <div className="text-orange-700">בהכנה</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-orange-900">{preparationProgress.ready}</div>
                <div className="text-orange-700">מוכן</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-orange-900">{preparationProgress.delivered}</div>
                <div className="text-orange-700">נמסר</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-0">
        <Button asChild size="sm" className="flex-1">
          <Link href="/orders/new">
            <Plus className="h-3 w-3 ml-1" />
            הזמנה חדשה
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/kitchen">
            <ChefHat className="h-3 w-3 ml-1" />
            מטבח
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/orders">
            <Calendar className="h-3 w-3 ml-1" />
            הזמנות
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center mb-1 text-orange-600">
        {icon}
      </div>
      <div className="text-lg font-bold text-orange-900">{value}</div>
      <div className="text-xs text-orange-700">{label}</div>
    </div>
  )
}
