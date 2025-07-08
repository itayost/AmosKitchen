// src/components/shared/date-picker.tsx
'use client'

import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

interface DatePickerProps {
    date: Date | undefined
    onDateChange: (date: Date | undefined) => void
    placeholder?: string
    className?: string
}

export function DatePicker({
    date,
    onDateChange,
    placeholder = 'בחר תאריך',
    className
}: DatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'justify-start text-left font-normal',
                        !date && 'text-muted-foreground',
                        className
                    )}
                >
                    <Calendar className="ml-2 h-4 w-4" />
                    {date ? format(date, 'dd/MM/yyyy', { locale: he }) : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={onDateChange}
                    locale={he}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}
