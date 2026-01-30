// src/components/friday/friday-hero.tsx
'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ChefHat, Plus, Package, TrendingUp, Wallet, AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { useFridayData, FridayStatus } from '@/lib/hooks/use-friday-data'
import { formatPrice } from '@/lib/utils'

// Status badge configuration
const statusConfig: Record<FridayStatus, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
  open: { variant: 'default', label: 'פתוח להזמנות' },
  'cutoff-soon': { variant: 'secondary', label: 'נסגר בקרוב' },
  closed: { variant: 'destructive', label: 'סגור' }
}

export function FridayHero() {
  const { data, isLoading, error, refetch } = useFridayData()

  if (isLoading) {
    return <FridayHeroSkeleton />
  }

  if (error) {
    return <FridayHeroError onRetry={refetch} />
  }

  if (!data) {
    return null
  }

  const dateStr = format(data.date, 'EEEE, d בMMMM', { locale: he })

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ChefHat className="h-4 w-4 text-orange-600" />
            יום שישי הקרוב
          </CardTitle>
          <Badge variant={statusConfig[data.status].variant}>
            {statusConfig[data.status].label}
          </Badge>
        </div>
        <p className="text-sm font-medium text-muted-foreground">{dateStr}</p>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="grid grid-cols-3 gap-2">
          <StatItem
            icon={<Package className="h-4 w-4" />}
            value={data.orderCount}
            label="הזמנות"
          />
          <StatItem
            icon={<TrendingUp className="h-4 w-4" />}
            value={data.dishCount}
            label="מנות"
          />
          <StatItem
            icon={<Wallet className="h-4 w-4" />}
            value={formatPrice(data.revenue)}
            label="הכנסות"
          />
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-0">
        <Button asChild size="sm" className="flex-1">
          <Link href="/orders/new">
            <Plus className="h-3 w-3 ml-1" />
            הזמנה
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/kitchen">
            <ChefHat className="h-3 w-3 ml-1" />
            מטבח
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

// Stat item component
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

// Loading skeleton
function FridayHeroSkeleton() {
  return (
    <Card className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 border-orange-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-40 mt-2" />
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-4 w-4 mx-auto mb-1" />
              <Skeleton className="h-6 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 pt-0">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-16" />
      </CardFooter>
    </Card>
  )
}

// Error state
function FridayHeroError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-destructive bg-destructive/5">
      <CardContent className="pt-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-3">
          שגיאה בטעינת נתוני שישי
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3 w-3 ml-1" />
          נסה שוב
        </Button>
      </CardContent>
    </Card>
  )
}
