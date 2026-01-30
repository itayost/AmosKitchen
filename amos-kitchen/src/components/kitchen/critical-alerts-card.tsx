'use client'

import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CustomerPreference } from '@/lib/types/database'

interface OrderWithPreferences {
  id: string
  orderNumber: string
  customer: {
    name: string
    preferences?: CustomerPreference[]
  }
}

interface CriticalAlertsCardProps {
  orders: OrderWithPreferences[]
}

function hasCriticalPreferences(preferences?: CustomerPreference[]): boolean {
  return preferences?.some(p => p.type === 'ALLERGY' || p.type === 'MEDICAL') || false
}

function getPreferenceSummary(preferences?: CustomerPreference[]): string | null {
  if (!preferences || preferences.length === 0) return null

  const critical = preferences.filter(p => p.type === 'ALLERGY' || p.type === 'MEDICAL')
  if (critical.length === 0) return null

  return critical.map(p => `${p.type === 'ALLERGY' ? '🚨 אלרגיה' : '⚕️ רפואי'}: ${p.value}`).join(' | ')
}

export function CriticalAlertsCard({ orders }: CriticalAlertsCardProps) {
  const ordersWithCritical = orders.filter(o => hasCriticalPreferences(o.customer.preferences))

  if (ordersWithCritical.length === 0) {
    return null
  }

  return (
    <Card className="border-2 border-red-500 bg-red-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          התראות קריטיות להיום
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {ordersWithCritical.map(order => (
            <div key={order.id} className="text-sm">
              <span className="font-semibold">{order.orderNumber} - {order.customer.name}:</span>
              <span className="text-red-600 mr-2">
                {getPreferenceSummary(order.customer.preferences)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export { hasCriticalPreferences, getPreferenceSummary }
