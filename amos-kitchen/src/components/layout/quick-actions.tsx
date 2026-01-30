// src/components/layout/quick-actions.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Plus, UserPlus, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'

export function QuickActions() {
  return (
    <div className="hidden lg:flex items-center gap-2">
      <Button asChild size="sm" variant="default">
        <Link
          href="/orders/new"
          onClick={() => trackEvent('quick_action_new_order', { source: 'header' })}
        >
          <Plus className="h-4 w-4 ml-1" />
          הזמנה חדשה
        </Link>
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link
          href="/customers/new"
          onClick={() => trackEvent('quick_action_new_customer', { source: 'header' })}
        >
          <UserPlus className="h-4 w-4 ml-1" />
          לקוח חדש
        </Link>
      </Button>
      <Button asChild size="sm" variant="ghost">
        <Link
          href="/dishes/new"
          onClick={() => trackEvent('quick_action_new_dish', { source: 'header' })}
        >
          <UtensilsCrossed className="h-4 w-4 ml-1" />
          מנה חדשה
        </Link>
      </Button>
    </div>
  )
}
