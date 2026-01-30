'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export interface DetailSkeletonProps {
  /** Show header with title skeleton */
  showHeader?: boolean
  /** Number of stat cards in a row */
  statCards?: number
  /** Number of content sections */
  sections?: number
  /** Show sidebar */
  showSidebar?: boolean
}

export function DetailSkeleton({
  showHeader = true,
  statCards = 0,
  sections = 1,
  showSidebar = false
}: DetailSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb skeleton */}
      <Skeleton className="h-5 w-48" />

      {/* Header skeleton */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      )}

      {/* Stat cards skeleton */}
      {statCards > 0 && (
        <div className={`grid gap-4 grid-cols-1 ${
          statCards === 1 ? 'md:grid-cols-1' :
          statCards === 2 ? 'md:grid-cols-2' :
          statCards === 3 ? 'md:grid-cols-3' :
          'md:grid-cols-4'
        }`}>
          {Array.from({ length: statCards }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main content with optional sidebar */}
      <div className={showSidebar ? 'grid gap-6 lg:grid-cols-3' : ''}>
        <div className={showSidebar ? 'lg:col-span-2 space-y-6' : 'space-y-6'}>
          {Array.from({ length: sections }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {showSidebar && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-28" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
