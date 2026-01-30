// src/components/reports/animated-stat-card.tsx
'use client'

import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimatedStatCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  gradient?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'none'
  sparklineData?: number[]
  className?: string
}

export function AnimatedStatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  change,
  changeLabel,
  icon: Icon,
  gradient = 'none',
  className
}: AnimatedStatCardProps) {
  const gradientStyles: Record<string, string> = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50',
    green: 'bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200/50',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200/50',
    orange: 'bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200/50',
    red: 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200/50',
    none: ''
  }

  const iconColors: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    none: 'text-muted-foreground'
  }

  const formatNumber = (num: number): string => {
    const fixed = num.toFixed(decimals)
    const [intPart, decPart] = fixed.split('.')
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return decPart ? `${formatted}.${decPart}` : formatted
  }

  const getTrendIcon = () => {
    if (change === undefined) return null
    if (change > 0) return <TrendingUp className="h-3 w-3" />
    if (change < 0) return <TrendingDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
  }

  const getTrendColor = () => {
    if (change === undefined) return ''
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-muted-foreground'
  }

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-md hover:scale-[1.02]',
        gradientStyles[gradient],
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-sm font-medium">
            {title}
          </CardDescription>
          {Icon && <Icon className={cn('h-4 w-4', iconColors[gradient])} />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">
          {prefix}{formatNumber(value)}{suffix}
        </div>

        {/* Trend indicator */}
        {change !== undefined && (
          <div className={cn('flex items-center gap-1 mt-2 text-sm', getTrendColor())}>
            {getTrendIcon()}
            <span>{Math.abs(change)}%</span>
            {changeLabel && (
              <span className="text-muted-foreground mr-1">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AnimatedStatCard
