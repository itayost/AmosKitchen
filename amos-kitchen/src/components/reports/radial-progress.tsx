// src/components/reports/radial-progress.tsx
'use client'

import { cn } from '@/lib/utils'

interface RadialProgressProps {
  value: number
  max: number
  size?: number
  thickness?: number
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red'
  showLabel?: boolean
  label?: string
  showPercentage?: boolean
  className?: string
}

export function RadialProgress({
  value,
  max,
  size = 120,
  thickness = 12,
  color = 'blue',
  showLabel = true,
  label,
  showPercentage = true,
  className
}: RadialProgressProps) {
  const percentage = Math.min((value / max) * 100, 100)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2
  const targetOffset = circumference - (circumference * percentage) / 100

  const colorMap = {
    blue: { stroke: '#3b82f6', bg: '#3b82f6' },
    green: { stroke: '#22c55e', bg: '#22c55e' },
    orange: { stroke: '#f97316', bg: '#f97316' },
    purple: { stroke: '#a855f7', bg: '#a855f7' },
    red: { stroke: '#ef4444', bg: '#ef4444' }
  }

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            className="text-muted/20"
          />

          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colorMap[color].stroke}
            strokeWidth={thickness}
            strokeDasharray={circumference}
            strokeDashoffset={targetOffset}
            strokeLinecap="round"
            className="transition-all"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showPercentage && (
            <div
              className="text-2xl font-bold"
              style={{ color: colorMap[color].stroke }}
            >
              {Math.round(percentage)}%
            </div>
          )}
          {!showPercentage && (
            <div className="text-xl font-bold">
              {value.toLocaleString('he-IL')}
            </div>
          )}
        </div>
      </div>

      {showLabel && label && (
        <span className="text-sm text-muted-foreground text-center">
          {label}
        </span>
      )}
    </div>
  )
}

export default RadialProgress
