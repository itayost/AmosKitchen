'use client'

import { useMemo } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { ChefHat, Package, Truck, X, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderHistory } from '@/lib/types/database'

// Status order for the timeline progression
const STATUS_ORDER = ['PREPARING', 'READY', 'DELIVERED'] as const

// Status configuration with icons, colors, and Hebrew labels
const statusConfig = {
  PREPARING: {
    label: 'בהכנה',
    icon: ChefHat,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-600',
  },
  READY: {
    label: 'מוכן',
    icon: Package,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-600',
  },
  DELIVERED: {
    label: 'נמסר',
    icon: Truck,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-600',
  },
  CANCELLED: {
    label: 'בוטל',
    icon: X,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-600',
  },
}

interface TimelineStep {
  status: string
  label: string
  icon: typeof ChefHat
  reached: boolean
  current: boolean
  timestamp?: Date
}

interface OrderTimelineProps {
  history: OrderHistory[]
  currentStatus: string
  createdAt?: Date | string
}

export function OrderTimeline({ history, currentStatus, createdAt }: OrderTimelineProps) {
  // Normalize status to uppercase
  const normalizedCurrentStatus = currentStatus.toUpperCase()

  // Build timeline steps from history
  const steps = useMemo(() => {
    // Extract status change timestamps from history
    const statusTimestamps = new Map<string, Date>()

    // Add creation timestamp for PREPARING status
    if (createdAt) {
      statusTimestamps.set('PREPARING', new Date(createdAt))
    }

    // Parse history for STATUS_CHANGED events
    history.forEach((event) => {
      if (event.action === 'STATUS_CHANGED' && event.details?.newStatus) {
        const status = event.details.newStatus.toUpperCase()
        statusTimestamps.set(status, new Date(event.createdAt))
      }
    })

    // Handle CANCELLED status specially - it terminates the timeline
    if (normalizedCurrentStatus === 'CANCELLED') {
      const currentIndex = STATUS_ORDER.indexOf(
        Array.from(statusTimestamps.keys())
          .filter((s) => STATUS_ORDER.includes(s as any))
          .pop() as any
      )

      const stepsBeforeCancelled = STATUS_ORDER.slice(0, Math.max(currentIndex + 1, 1))

      const timelineSteps: TimelineStep[] = stepsBeforeCancelled.map((status) => {
        const config = statusConfig[status]
        const timestamp = statusTimestamps.get(status)
        return {
          status,
          label: config.label,
          icon: config.icon,
          reached: statusTimestamps.has(status),
          current: false,
          timestamp,
        }
      })

      // Add CANCELLED step at the end
      const cancelledConfig = statusConfig.CANCELLED
      timelineSteps.push({
        status: 'CANCELLED',
        label: cancelledConfig.label,
        icon: cancelledConfig.icon,
        reached: true,
        current: true,
        timestamp: statusTimestamps.get('CANCELLED'),
      })

      return timelineSteps
    }

    // Normal flow - build steps from STATUS_ORDER
    const currentIndex = STATUS_ORDER.indexOf(normalizedCurrentStatus as any)

    return STATUS_ORDER.map((status, index) => {
      const config = statusConfig[status]
      const reached = index <= currentIndex
      const current = status === normalizedCurrentStatus
      const timestamp = statusTimestamps.get(status)

      return {
        status,
        label: config.label,
        icon: config.icon,
        reached,
        current,
        timestamp,
      }
    })
  }, [history, normalizedCurrentStatus, createdAt])

  if (!steps.length) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        אין מידע זמין על סטטוס ההזמנה
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Desktop: Horizontal Timeline */}
      <div className="hidden md:block">
        <div className="flex items-start justify-between">
          {steps.map((step, index) => {
            const config = statusConfig[step.status as keyof typeof statusConfig]
            const Icon = step.icon
            const isLast = index === steps.length - 1

            return (
              <div key={step.status} className="flex-1 flex flex-col items-center">
                {/* Step indicator */}
                <div className="flex items-center w-full">
                  {/* Connector line (before) */}
                  {index > 0 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5',
                        steps[index - 1].reached ? config.bgColor : 'bg-gray-200'
                      )}
                    />
                  )}

                  {/* Icon circle */}
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                      step.reached
                        ? cn(config.bgColor, config.borderColor)
                        : 'bg-gray-50 border-gray-300',
                      step.current && 'ring-4 ring-offset-2 ring-opacity-30',
                      step.current && step.status === 'CANCELLED'
                        ? 'ring-red-200'
                        : step.current
                          ? 'ring-primary/30'
                          : ''
                    )}
                  >
                    {step.reached ? (
                      <Icon
                        className={cn('w-5 h-5', config.color)}
                      />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* Connector line (after) */}
                  {!isLast && (
                    <div
                      className={cn(
                        'flex-1 h-0.5',
                        step.reached ? statusConfig[steps[index + 1]?.status as keyof typeof statusConfig]?.bgColor || 'bg-gray-200' : 'bg-gray-200'
                      )}
                    />
                  )}
                </div>

                {/* Label and timestamp */}
                <div className="mt-3 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      step.reached ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.timestamp ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(step.timestamp, 'dd/MM HH:mm', { locale: he })}
                    </p>
                  ) : step.reached ? (
                    <p className="text-xs text-muted-foreground mt-1">-</p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile: Vertical Timeline */}
      <div className="md:hidden">
        <div className="relative">
          {steps.map((step, index) => {
            const config = statusConfig[step.status as keyof typeof statusConfig]
            const Icon = step.icon
            const isLast = index === steps.length - 1

            return (
              <div key={step.status} className="flex gap-4 pb-6 last:pb-0">
                {/* Icon and connector */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full border-2',
                      step.reached
                        ? cn(config.bgColor, config.borderColor)
                        : 'bg-gray-50 border-gray-300',
                      step.current && 'ring-2 ring-offset-1',
                      step.current && step.status === 'CANCELLED'
                        ? 'ring-red-200'
                        : step.current
                          ? 'ring-primary/30'
                          : ''
                    )}
                  >
                    {step.reached ? (
                      <Icon className={cn('w-4 h-4', config.color)} />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        'w-0.5 flex-1 mt-2',
                        step.reached ? config.bgColor : 'bg-gray-200'
                      )}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      step.reached ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.timestamp && (
                    <p className="text-xs text-muted-foreground mt-0.5 break-words">
                      {format(step.timestamp, 'dd/MM/yyyy בשעה HH:mm', { locale: he })}
                      <span className="mx-1">•</span>
                      {formatDistanceToNow(step.timestamp, { addSuffix: true, locale: he })}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
