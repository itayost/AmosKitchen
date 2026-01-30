'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FormErrorProps {
  title?: string
  message: string
  onRetry?: () => void
  variant?: 'error' | 'warning'
  className?: string
}

export function FormError({
  title,
  message,
  onRetry,
  variant = 'error',
  className
}: FormErrorProps) {
  const isError = variant === 'error'
  const Icon = isError ? XCircle : AlertTriangle

  return (
    <Card className={cn(
      isError ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50',
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Icon className={cn(
            'h-6 w-6 flex-shrink-0',
            isError ? 'text-red-600' : 'text-orange-600'
          )} />
          <div className="flex-1">
            <h3 className={cn(
              'font-semibold',
              isError ? 'text-red-800' : 'text-orange-800'
            )}>
              {title || (isError ? 'שגיאה בטעינת הנתונים' : 'אזהרה')}
            </h3>
            <p className={cn(
              'text-sm mt-1',
              isError ? 'text-red-700' : 'text-orange-700'
            )}>
              {message}
            </p>
            {onRetry && (
              <Button
                onClick={onRetry}
                className="mt-3"
                variant="outline"
                size="sm"
              >
                נסה שוב
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
