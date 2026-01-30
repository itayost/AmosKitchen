// src/components/reports/sparkline.tsx
'use client'

import { cn } from '@/lib/utils'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  strokeWidth?: number
  showArea?: boolean
  color?: 'auto' | 'blue' | 'green' | 'red' | 'purple'
  className?: string
}

export function Sparkline({
  data,
  width = 100,
  height = 32,
  strokeWidth = 2,
  showArea = false,
  color = 'auto',
  className
}: SparklineProps) {
  if (!data || data.length < 2) return null

  const padding = 2
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding)
    const y = height - padding - ((value - min) / range) * (height - 2 * padding)
    return { x, y }
  })

  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
  const areaD = `${pathD} L ${points[points.length - 1].x},${height - padding} L ${padding},${height - padding} Z`

  // Determine color based on trend or prop
  const getStrokeColor = () => {
    if (color !== 'auto') {
      const colors = {
        blue: '#3b82f6',
        green: '#22c55e',
        red: '#ef4444',
        purple: '#a855f7'
      }
      return colors[color]
    }
    const isPositive = data[data.length - 1] >= data[0]
    return isPositive ? '#22c55e' : '#ef4444'
  }

  const strokeColor = getStrokeColor()

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('w-full h-full', className)}
      preserveAspectRatio="none"
    >
      {showArea && (
        <path
          d={areaD}
          fill={strokeColor}
          className="opacity-10"
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-80"
      />
    </svg>
  )
}

export default Sparkline
