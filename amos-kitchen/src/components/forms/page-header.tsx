'use client'

import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  title: string
  description?: string
  badge?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
