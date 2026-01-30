// components/shared/loading-spinner.tsx
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
    className?: string
    centered?: boolean
    size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3'
}

export function LoadingSpinner({ className, centered, size = 'md' }: LoadingSpinnerProps) {
    const spinner = (
        <div
            className={cn(
                "animate-spin rounded-full border-primary border-t-transparent",
                sizeClasses[size],
                className
            )}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    )

    if (centered) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                {spinner}
            </div>
        )
    }

    return spinner
}
