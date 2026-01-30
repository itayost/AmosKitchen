'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, Users, TrendingDown, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

export interface NeedsAttentionAlert {
  id: string
  type: 'new_orders' | 'approaching_delivery' | 'critical_preferences' | 'low_fulfillment'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  count: number
  actionLabel: string
  actionHref: string
  icon: LucideIcon
}

interface NeedsAttentionSectionProps {
  alerts: NeedsAttentionAlert[]
}

export function NeedsAttentionSection({ alerts }: NeedsAttentionSectionProps) {
  if (alerts.length === 0) {
    return null
  }

  const handleAlertClick = (alertType: string) => {
    trackEvent('dashboard_alert_clicked', { alertType })
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <AlertTriangle className="h-5 w-5" />
          דורש תשומת לב
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {alerts.map((alert) => {
            const Icon = alert.icon
            const borderColor = {
              high: 'border-red-300 bg-red-50',
              medium: 'border-orange-300 bg-orange-50',
              low: 'border-yellow-300 bg-yellow-50'
            }[alert.priority]

            const iconColor = {
              high: 'text-red-600',
              medium: 'text-orange-600',
              low: 'text-yellow-600'
            }[alert.priority]

            return (
              <Card key={alert.id} className={borderColor}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${iconColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{alert.title}</h4>
                          {alert.count > 0 && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                              {alert.count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {alert.description}
                        </p>
                      </div>
                      <Button 
                        asChild 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleAlertClick(alert.type)}
                      >
                        <Link href={alert.actionHref}>
                          {alert.actionLabel}
                          <ArrowLeft className="mr-2 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
