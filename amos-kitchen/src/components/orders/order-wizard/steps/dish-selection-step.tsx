'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { Plus, Trash2, AlertTriangle, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { useOrderWizard, getAvailableFridays } from '@/contexts/order-wizard-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Dish } from '@/lib/types/database'

interface DishSelectionStepProps {
  dishes: Dish[]
}

// Format date for Hebrew display
const formatDeliveryDate = (date: Date): string => {
  return format(date, 'EEEE, dd בMMMM yyyy', { locale: he })
}

export function DishSelectionStep({ dishes }: DishSelectionStepProps) {
  const {
    state,
    total,
    setDeliveryDate,
    setDeliveryAddress,
    addItem,
    updateItem,
    removeItem,
    nextStep,
    prevStep,
    canProceed,
    hasCriticalPreferences
  } = useOrderWizard()

  const availableFridays = useMemo(() => getAvailableFridays(), [])

  // Get available dishes (only those that are available)
  const availableDishes = useMemo(() => {
    return dishes.filter(d => d.isAvailable)
  }, [dishes])

  // Calculate item subtotal
  const getItemSubtotal = (dishId: string, quantity: number): number => {
    const dish = dishes.find(d => d.id === dishId)
    return dish ? dish.price * quantity : 0
  }

  // Handle dish selection
  const handleDishChange = (index: number, dishId: string) => {
    const dish = dishes.find(d => d.id === dishId)
    updateItem(index, {
      dishId,
      price: dish?.price || 0
    })
  }

  // Handle quantity change
  const handleQuantityChange = (index: number, value: string) => {
    const quantity = parseInt(value) || 1
    updateItem(index, { quantity: Math.max(1, quantity) })
  }

  // Handle notes change
  const handleNotesChange = (index: number, notes: string) => {
    updateItem(index, { notes })
  }

  return (
    <div className="space-y-6">
      {/* Customer Preferences Alert */}
      {hasCriticalPreferences && state.customer?.preferences && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">שים לב - {state.customer.name}: </span>
            {state.customer.preferences
              .filter(p => p.type === 'ALLERGY' || p.type === 'MEDICAL')
              .map(p => `${p.type === 'ALLERGY' ? 'אלרגיה' : 'רפואי'} - ${p.value}`)
              .join(', ')
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Delivery Date Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">פרטי משלוח</CardTitle>
          <CardDescription>משלוחים בימי שישי בלבד. הזמנות נסגרות ביום חמישי ב-18:00</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Delivery Date */}
            <div className="space-y-2">
              <Label>תאריך משלוח *</Label>
              <Select
                value={state.deliveryDate.toISOString()}
                onValueChange={(value) => setDeliveryDate(new Date(value))}
              >
                <SelectTrigger className="text-right">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                      <span>{formatDeliveryDate(state.deliveryDate)}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
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
            </div>

            {/* Delivery Address */}
            <div className="space-y-2">
              <Label>כתובת למשלוח</Label>
              <Input
                value={state.deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder={state.customer?.address || 'הזן כתובת למשלוח'}
                className="text-right"
                dir="rtl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">מנות להזמנה</CardTitle>
          <CardDescription>בחר מנות מהתפריט והוסף כמות</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.items.map((item, index) => (
            <div key={index} className="space-y-3 p-3 sm:p-4 border rounded-lg">
              <div className="grid gap-3 sm:gap-4 md:grid-cols-12">
                {/* Dish Selection */}
                <div className="md:col-span-6 space-y-2">
                  <Label>מנה</Label>
                  <Select
                    value={item.dishId}
                    onValueChange={(value) => handleDishChange(index, value)}
                  >
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="בחר מנה" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDishes.map((dish) => (
                        <SelectItem key={dish.id} value={dish.id} className="text-right">
                          <div className="flex items-center justify-between w-full gap-4">
                            <span>{dish.name}</span>
                            <span className="text-muted-foreground">₪{dish.price}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity + Remove (row on mobile) */}
                <div className="flex gap-2 md:contents">
                  <div className="flex-1 md:col-span-2 space-y-2">
                    <Label>כמות</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      className="text-center"
                    />
                  </div>

                  {/* Remove Button - inline on mobile */}
                  <div className="md:hidden flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={state.items.length === 1}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Item Notes */}
                <div className="md:col-span-3 space-y-2">
                  <Label>הערות</Label>
                  <Input
                    placeholder="הערות למנה"
                    value={item.notes}
                    onChange={(e) => handleNotesChange(index, e.target.value)}
                    className="text-right"
                    dir="rtl"
                  />
                </div>

                {/* Remove Button - desktop only */}
                <div className="hidden md:flex md:col-span-1 items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={state.items.length === 1}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Item Subtotal */}
              {item.dishId && (
                <div className="text-sm text-muted-foreground text-right">
                  סה״כ למנה: ₪{getItemSubtotal(item.dishId, item.quantity).toFixed(2)}
                </div>
              )}
            </div>
          ))}

          {/* Add Item Button */}
          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            הוסף מנה
          </Button>

          {/* Order Total */}
          <Separator />
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>סה״כ להזמנה:</span>
            <span>₪{total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={prevStep}
          className="gap-2"
        >
          <ChevronRight className="h-4 w-4" />
          חזרה
        </Button>
        <Button
          onClick={nextStep}
          disabled={!canProceed}
          className="gap-2"
        >
          הבא
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
