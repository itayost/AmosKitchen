// components/shared/loading-spinner.tsx
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
    className?: string
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
    return (
        <div
            className={cn(
                "animate-spin rounded-full border-2 border-primary border-t-transparent",
                "h-8 w-8",
                className
            )}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    )
}
