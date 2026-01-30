'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({
  title,
  description,
  children,
  className
}: FormSectionProps) {
  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={cn('space-y-4', !title && !description && 'pt-6')}>
        {children}
      </CardContent>
    </Card>
  )
}
