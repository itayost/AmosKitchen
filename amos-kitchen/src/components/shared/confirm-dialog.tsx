'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2, XCircle, Info, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info'

const variantConfig = {
  danger: {
    icon: Trash2,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
    actionColor: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
    actionColor: 'bg-orange-600 hover:bg-orange-700 text-white',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    actionColor: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
}

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void> | void
  variant?: ConfirmDialogVariant
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  variant = 'danger',
  title,
  description,
  confirmLabel = 'אישור',
  cancelLabel = 'ביטול',
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const config = variantConfig[variant]
  const Icon = config.icon

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)

    try {
      await onConfirm()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'אירעה שגיאה')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setError(null)
      onOpenChange(newOpen)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                config.iconBg
              )}
            >
              <Icon className={cn('h-5 w-5', config.iconColor)} />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-md text-sm text-red-700">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={loading}
            className={cn(config.actionColor)}
          >
            {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
