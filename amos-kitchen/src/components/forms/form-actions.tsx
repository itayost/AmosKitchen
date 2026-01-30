'use client'

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FormActionsProps {
  onCancel: () => void
  onSubmit?: () => void
  cancelLabel?: string
  submitLabel?: string
  isSubmitting?: boolean
  submitDisabled?: boolean
  className?: string
}

export function FormActions({
  onCancel,
  onSubmit,
  cancelLabel = 'ביטול',
  submitLabel = 'שמור',
  isSubmitting = false,
  submitDisabled = false,
  className
}: FormActionsProps) {
  return (
    <div className={cn('flex justify-end gap-2 mt-6', className)}>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        {cancelLabel}
      </Button>
      <Button
        type={onSubmit ? 'button' : 'submit'}
        onClick={onSubmit}
        disabled={isSubmitting || submitDisabled}
      >
        {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? 'שומר...' : submitLabel}
      </Button>
    </div>
  )
}
