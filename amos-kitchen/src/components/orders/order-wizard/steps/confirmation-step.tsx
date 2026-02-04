'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import {
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Loader2,
  CheckCircle
} from 'lucide-react'
import { useOrderWizard } from '@/contexts/order-wizard-context'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'
import { useToast } from '@/lib/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Dish } from '@/lib/types/database'

interface ConfirmationStepProps {
  dishes: Dish[]
  onComplete?: () => void
}

// Format date for Hebrew display
const formatDeliveryDate = (date: Date): string => {
  return format(date, 'EEEE, dd בMMMM yyyy', { locale: he })
}

export function ConfirmationStep({ dishes, onComplete }: ConfirmationStepProps) {
  const router = useRouter()
  const { toast } = useToast()
  const {
    state,
    total,
    setNotes,
    prevStep,
    setSubmitting,
    setSubmitError,
    hasCriticalPreferences
  } = useOrderWizard()

  // Get dish name by ID
  const getDishName = (dishId: string): string => {
    const dish = dishes.find(d => d.id === dishId)
    return dish?.name || 'מנה לא ידועה'
  }

  // Get dish price by ID
  const getDishPrice = (dishId: string): number => {
    const dish = dishes.find(d => d.id === dishId)
    return dish?.price || 0
  }

  // Handle order submission
  const handleSubmit = async () => {
    if (!state.customer) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור לקוח',
        variant: 'destructive'
      })
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      // Prepare items with prices
      const itemsWithPrices = state.items
        .filter(item => item.dishId) // Only include items with selected dishes
        .map(item => {
          const dish = dishes.find(d => d.id === item.dishId)
          if (!dish) {
            throw new Error(`מנה לא נמצאה: ${item.dishId}`)
          }
          return {
            dishId: item.dishId,
            quantity: item.quantity,
            price: dish.price,
            notes: item.notes || ''
          }
        })

      if (itemsWithPrices.length === 0) {
        throw new Error('יש להוסיף לפחות מנה אחת להזמנה')
      }

      const orderData = {
        customerId: state.customer.id,
        deliveryDate: state.deliveryDate.toISOString(),
        deliveryAddress: state.deliveryAddress || state.customer.address || '',
        notes: state.notes || '',
        items: itemsWithPrices
      }

      const response = await fetchWithAuth('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'שגיאה ביצירת ההזמנה')
      }

      const order = await response.json()

      toast({
        title: 'ההזמנה נוצרה בהצלחה',
        description: `הזמנה מספר ${order.orderNumber || order.id} נוצרה עבור ${state.customer.name}`,
      })

      if (onComplete) {
        onComplete()
      } else {
        router.push('/orders')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'אירעה שגיאה ביצירת ההזמנה'
      setSubmitError(errorMessage)
      toast({
        title: 'שגיאה',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Filter valid items (with selected dishes)
  const validItems = state.items.filter(item => item.dishId)

  return (
    <div className="space-y-6">
      {/* Critical Preferences Reminder */}
      {hasCriticalPreferences && state.customer?.preferences && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">תזכורת - {state.customer.name}: </span>
            {state.customer.preferences
              .filter(p => p.type === 'ALLERGY' || p.type === 'MEDICAL')
              .map(p => `${p.type === 'ALLERGY' ? 'אלרגיה' : 'רפואי'} - ${p.value}`)
              .join(', ')
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Customer Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            לקוח
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="font-semibold text-lg">{state.customer?.name}</div>
            <div className="text-sm text-muted-foreground">{state.customer?.phone}</div>
            {state.customer?.email && (
              <div className="text-sm text-muted-foreground">{state.customer.email}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            משלוח
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDeliveryDate(state.deliveryDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{state.deliveryAddress || state.customer?.address || 'לא צוינה כתובת'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Order Items Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">מנות ({validItems.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {validItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{getDishName(item.dishId)}</span>
                <span className="text-muted-foreground">× {item.quantity}</span>
              </div>
              <span>₪{(getDishPrice(item.dishId) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex items-center justify-between text-lg font-bold">
            <span>סה״כ לתשלום</span>
            <span>₪{total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">הערות להזמנה</CardTitle>
          <CardDescription>הערות נוספות יועברו למטבח ולמשלוח</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={state.notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="הערות מיוחדות להזמנה..."
            rows={3}
            className="text-right"
            dir="rtl"
          />
        </CardContent>
      </Card>

      {/* Error Display */}
      {state.submitError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{state.submitError}</AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={state.isSubmitting}
          className="gap-2"
        >
          <ChevronRight className="h-4 w-4" />
          חזרה
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={state.isSubmitting || validItems.length === 0}
          className="gap-2"
        >
          {state.isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              יוצר הזמנה...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              צור הזמנה
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
