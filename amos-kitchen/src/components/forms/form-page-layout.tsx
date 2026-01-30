'use client'

import { Breadcrumb, BreadcrumbItem } from '@/components/shared/breadcrumb'
import { PageHeader } from './page-header'
import { FormSkeleton } from './form-skeleton'
import { FormError } from './form-error'
import { cn } from '@/lib/utils'

export interface FormPageLayoutProps {
  /** Breadcrumb navigation items */
  breadcrumbs: BreadcrumbItem[]

  /** Page title */
  title: string

  /** Page description (subtitle) */
  description?: string

  /** Badge element to show next to title */
  badge?: React.ReactNode

  /** Action buttons in the header (e.g., Delete button) */
  headerActions?: React.ReactNode

  /** Main content (form) */
  children: React.ReactNode

  /** Loading state - shows skeleton when true */
  isLoading?: boolean

  /** Skeleton configuration for loading state */
  loadingSkeletonConfig?: {
    sections?: number
    fieldsPerSection?: number[]
  }

  /** Error message - shows error card when set */
  error?: string | null

  /** Callback for retry button in error state */
  onRetry?: () => void

  /** Maximum width constraint */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

  className?: string
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full'
}

export function FormPageLayout({
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
  maxWidth,
  className
}: FormPageLayoutProps) {
  const wrapperClass = cn(
    'space-y-6',
    maxWidth && maxWidthClasses[maxWidth],
    maxWidth && 'mx-auto',
    className
  )

  return (
    <div className={wrapperClass}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbs} />

      {/* Page Header */}
      <PageHeader
        title={title}
        description={description}
        badge={badge}
        actions={headerActions}
      />

      {/* Content: Loading, Error, or Children */}
      {isLoading ? (
        <FormSkeleton {...loadingSkeletonConfig} />
      ) : error ? (
        <FormError message={error} onRetry={onRetry} />
      ) : (
        children
      )}
    </div>
  )
}
