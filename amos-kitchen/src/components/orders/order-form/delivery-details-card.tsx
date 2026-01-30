'use client'

import { Calendar as CalendarIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { getAvailableFridays, formatDeliveryDate } from '@/lib/utils/friday-dates'
import type { Control } from 'react-hook-form'

interface DeliveryDetailsCardProps {
  control: Control<any>
}

export function DeliveryDetailsCard({ control }: DeliveryDetailsCardProps) {
  const availableFridays = getAvailableFridays()

  return (
    <Card>
      <CardHeader>
        <CardTitle>פרטי משלוח</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="deliveryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>תאריך משלוח *</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(new Date(value))}
                  value={field.value?.toISOString()}
                >
                  <FormControl>
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="בחר יום שישי למשלוח">
                        {field.value && (
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 opacity-50" />
                            <span>{formatDeliveryDate(field.value)}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableFridays.map((friday, index) => (
                      <SelectItem
                        key={friday.toISOString()}
                        value={friday.toISOString()}
                        className="text-right"
                      >
                        <div className="flex flex-col items-start">
                          <span>{formatDeliveryDate(friday)}</span>
                          {index === 0 && (
                            <span className="text-xs text-muted-foreground">
                              (הקרוב ביותר)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  משלוחים בימי שישי בלבד. הזמנות נסגרות ביום חמישי ב-18:00
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="deliveryAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>כתובת למשלוח</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="אם שונה מכתובת הלקוח" className="text-right" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}
