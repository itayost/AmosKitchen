'use client'

import { Breadcrumb, BreadcrumbItem } from '@/components/shared/breadcrumb'
import { PageHeader } from './page-header'
import { DetailSkeleton, DetailSkeletonProps } from './detail-skeleton'
import { FormError } from './form-error'
import { cn } from '@/lib/utils'

export interface DetailPageLayoutProps {
  /** Breadcrumb navigation items */
  breadcrumbs: BreadcrumbItem[]

  /** Page title */
  title: string

  /** Page description (subtitle) */
  description?: string

  /** Badge element to show next to title */
  badge?: React.ReactNode

  /** Action buttons in the header */
  headerActions?: React.ReactNode

  /** Main content */
  children: React.ReactNode

  /** Loading state - shows skeleton when true */
  isLoading?: boolean

  /** Skeleton configuration for loading state */
  loadingSkeletonConfig?: DetailSkeletonProps

  /** Error message - shows error card when set */
  error?: string | null

  /** Callback for retry button in error state */
  onRetry?: () => void

  className?: string
}

export function DetailPageLayout({
  breadcrumbs,
  title,
  description,
  badge,
  headerActions,
  children,
  isLoading = false,
  loadingSkeletonConfig,
  error,
  onRetry,
  className
}: DetailPageLayoutProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <DetailSkeleton {...loadingSkeletonConfig} />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('space-y-6', className)}>
        <Breadcrumb items={breadcrumbs} />
        <FormError message={error} onRetry={onRetry} />
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbs} />

      {/* Page Header */}
      <PageHeader
        title={title}
        description={description}
        badge={badge}
        actions={headerActions}
      />

      {/* Content */}
      {children}
    </div>
  )
}
