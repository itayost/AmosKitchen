// src/components/reports/donut-chart.tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface DonutChartData {
  label: string
  value: number
  color?: string
}

interface DonutChartProps {
  data: DonutChartData[]
  size?: number
  thickness?: number
  showLegend?: boolean
  showTotal?: boolean
  totalLabel?: string
  className?: string
}

const defaultColors = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f97316', // orange
  '#a855f7', // purple
  '#ef4444', // red
  '#06b6d4', // cyan
  '#eab308', // yellow
  '#ec4899', // pink
]

export function DonutChart({
  data,
  size = 200,
  thickness = 40,
  showLegend = true,
  showTotal = true,
  totalLabel = 'סה"כ',
  className
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  // Calculate segment offsets
  let cumulativeOffset = 0
  const segments = data.map((item, index) => {
    const percentage = item.value / total
    const segmentLength = circumference * percentage
    const offset = cumulativeOffset
    cumulativeOffset += segmentLength

    return {
      ...item,
      percentage,
      segmentLength,
      offset,
      color: item.color || defaultColors[index % defaultColors.length]
    }
  })

  const formatNumber = (num: number) => {
    return num.toLocaleString('he-IL')
  }

  const formatPercentage = (percentage: number) => {
    return `${(percentage * 100).toFixed(1)}%`
  }

  return (
    <div className={cn('flex items-center gap-6', className)}>
      {/* Chart */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
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

          {/* Segments */}
          {segments.map((segment, index) => (
            <circle
              key={index}
              className="donut-segment transition-all duration-200 cursor-pointer"
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={hoveredIndex === index ? thickness + 4 : thickness}
              strokeDasharray={circumference}
              strokeDashoffset={circumference - segment.segmentLength}
              strokeLinecap="round"
              style={{
                transform: `rotate(${(segment.offset / circumference) * 360}deg)`,
                transformOrigin: 'center',
                opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.5 : 1
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>

        {/* Center content */}
        {showTotal && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{formatNumber(total)}</span>
            <span className="text-sm text-muted-foreground">{totalLabel}</span>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-col gap-2">
          {segments.map((segment, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-2 cursor-pointer transition-opacity',
                hoveredIndex !== null && hoveredIndex !== index && 'opacity-50'
              )}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{segment.label}</span>
                <span className="text-xs text-muted-foreground">
                  {formatNumber(segment.value)} ({formatPercentage(segment.percentage)})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DonutChart
