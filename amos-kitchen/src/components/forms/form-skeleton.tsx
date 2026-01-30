'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface FormSkeletonProps {
  /** Number of card sections to show */
  sections?: number
  /** Array of field counts per section */
  fieldsPerSection?: number[]
  /** Whether to show footer action buttons skeleton */
  showFooter?: boolean
  className?: string
}

export function FormSkeleton({
  sections = 1,
  fieldsPerSection = [4],
  showFooter = true,
  className
}: FormSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: sections }).map((_, sectionIndex) => (
        <Card key={sectionIndex}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: fieldsPerSection[sectionIndex] || 4 }).map((_, fieldIndex) => (
              <div key={fieldIndex} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {showFooter && (
        <div className="flex justify-end gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      )}
    </div>
  )
}
