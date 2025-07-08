// components/orders/order-filters.tsx
'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import type { OrderFilters as OrderFiltersType, OrderStatus } from '@/lib/types/database'

interface OrderFiltersProps {
    filters: OrderFiltersType
    onFiltersChange: (filters: OrderFiltersType) => void
}

const statusOptions: { value: OrderStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'כל הסטטוסים' },
    { value: 'new', label: 'חדש' },
    { value: 'confirmed', label: 'אושר' },
    { value: 'preparing', label: 'בהכנה' },
    { value: 'ready', label: 'מוכן' },
    { value: 'delivered', label: 'נמסר' },
    { value: 'cancelled', label: 'בוטל' },
]

const dateRangeOptions = [
    { value: 'all', label: 'כל התאריכים' },
    { value: 'today', label: 'היום' },
    { value: 'week', label: 'השבוע' },
    { value: 'month', label: 'החודש' },
]

export function OrderFilters({ filters, onFiltersChange }: OrderFiltersProps) {
    const handleSearchChange = (value: string) => {
        onFiltersChange({ ...filters, search: value, page: 1 })
    }

    const handleStatusChange = (value: string) => {
        onFiltersChange({ ...filters, status: value, page: 1 })
    }

    const handleDateRangeChange = (value: string) => {
        onFiltersChange({ ...filters, dateRange: value, page: 1 })
    }

    return (
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="חיפוש לפי מספר הזמנה, שם לקוח או טלפון..."
                    value={filters.search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pr-10"
                />
            </div>
            <Select value={filters.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="סנן לפי סטטוס" />
                </SelectTrigger>
                <SelectContent>
                    {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={filters.dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="סנן לפי תאריך" />
                </SelectTrigger>
                <SelectContent>
                    {dateRangeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
