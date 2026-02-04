// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format price in ILS
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
  }).format(price)
}

// Generate order number
export function generateOrderNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')

  return `ORD-${year}${month}${day}-${random}`
}

// Status color mapping
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    PREPARING: 'bg-yellow-100 text-yellow-800',
    READY: 'bg-green-100 text-green-800',
    DELIVERED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }

  return statusColors[status] || statusColors[status.toUpperCase()] || 'bg-gray-100 text-gray-800'
}

// Status Hebrew labels
export function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    PREPARING: 'בהכנה',
    READY: 'מוכן',
    DELIVERED: 'נמסר',
    CANCELLED: 'בוטל',
  }

  return statusLabels[status] || statusLabels[status.toUpperCase()] || status
}
