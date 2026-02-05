'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  OrderWizardProvider,
  useOrderWizard,
  CustomerWithPreferences
} from '@/contexts/order-wizard-context'
import { useDuplicateOrder } from '@/lib/hooks/use-duplicate-order'
import { CustomerSelectionStep } from './steps/customer-selection-step'
import { DishSelectionStep } from './steps/dish-selection-step'
import { ConfirmationStep } from './steps/confirmation-step'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, User, Utensils, CheckCircle } from 'lucide-react'
import type { Dish } from '@/lib/types/database'

// Step configuration
const STEPS = [
  { number: 1, label: 'בחירת לקוח', icon: User },
  { number: 2, label: 'בחירת מנות', icon: Utensils },
  { number: 3, label: 'אישור הזמנה', icon: CheckCircle }
] as const

interface OrderWizardProps {
  customers: CustomerWithPreferences[]
  dishes: Dish[]
  deliveryFee?: number
  initialCustomerId?: string | null
  duplicateOrderId?: string | null
  onComplete?: () => void
}

// Step Progress Indicator
function StepIndicator() {
  const { state } = useOrderWizard()

  return (
    <div className="mb-8">
      <nav aria-label="Wizard progress">
        <ol className="flex items-center justify-center gap-2 md:gap-4">
          {STEPS.map((step, index) => {
            const isActive = state.currentStep === step.number
            const isCompleted = state.currentStep > step.number
            const Icon = step.icon

            return (
              <li key={step.number} className="flex items-center">
                {/* Step */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                      isActive && 'border-primary bg-primary text-primary-foreground',
                      isCompleted && 'border-primary bg-primary/20 text-primary',
                      !isActive && !isCompleted && 'border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs mt-1 hidden md:block',
                      isActive && 'font-semibold text-foreground',
                      !isActive && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector */}
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-8 md:w-16 h-0.5 mx-2',
                      state.currentStep > step.number ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}

// Wizard Content Component
function WizardContent({
  customers,
  dishes,
  initialCustomerId,
  duplicateOrderId,
  onComplete
}: Omit<OrderWizardProps, 'customers' | 'dishes'> & {
  customers: CustomerWithPreferences[]
  dishes: Dish[]
}) {
  const { state, initFromCustomer, initFromDuplicate } = useOrderWizard()

  // Handle duplicate order
  const {
    customer: duplicateCustomer,
    items: duplicateItems,
    deliveryMethod: duplicateDeliveryMethod,
    notes: duplicateNotes,
    skippedItems,
    warnings,
    isLoading: loadingDuplicate,
    error: duplicateError
  } = useDuplicateOrder({
    orderId: duplicateOrderId,
    availableDishes: dishes
  })

  // Initialize from customer ID (pre-select customer and skip to step 2)
  useEffect(() => {
    if (initialCustomerId && !duplicateOrderId) {
      const customer = customers.find(c => c.id === initialCustomerId)
      if (customer) {
        initFromCustomer(customer)
      }
    }
  }, [initialCustomerId, customers, duplicateOrderId, initFromCustomer])

  // Initialize from duplicate order
  useEffect(() => {
    if (duplicateCustomer && duplicateItems && !loadingDuplicate) {
      initFromDuplicate(duplicateCustomer, duplicateItems, duplicateDeliveryMethod, duplicateNotes)
    }
  }, [duplicateCustomer, duplicateItems, duplicateDeliveryMethod, duplicateNotes, loadingDuplicate, initFromDuplicate])

  // Show loading state for duplicate order
  if (duplicateOrderId && loadingDuplicate) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show error for duplicate order
  if (duplicateError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>שגיאה בטעינת ההזמנה</AlertTitle>
        <AlertDescription>{duplicateError.message}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div>
      {/* Show warnings for skipped dishes */}
      {warnings.length > 0 && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>שים לב</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
              {skippedItems.length > 0 && (
                <li className="mt-2">
                  מנות שהוסרו:
                  <ul className="mr-4 mt-1">
                    {skippedItems.map((item, index) => (
                      <li key={index} className="text-sm">
                        {item.dishName} (×{item.quantity}) - {item.reason}
                      </li>
                    ))}
                  </ul>
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Step Indicator */}
      <StepIndicator />

      {/* Step Content */}
      {state.currentStep === 1 && (
        <CustomerSelectionStep customers={customers} />
      )}

      {state.currentStep === 2 && (
        <DishSelectionStep dishes={dishes} />
      )}

      {state.currentStep === 3 && (
        <ConfirmationStep dishes={dishes} onComplete={onComplete} />
      )}
    </div>
  )
}

// Main OrderWizard Component
export function OrderWizard({
  customers,
  dishes,
  deliveryFee,
  initialCustomerId,
  duplicateOrderId,
  onComplete
}: OrderWizardProps) {
  return (
    <OrderWizardProvider dishes={dishes} deliveryFee={deliveryFee}>
      <WizardContent
        customers={customers}
        dishes={dishes}
        initialCustomerId={initialCustomerId}
        duplicateOrderId={duplicateOrderId}
        onComplete={onComplete}
      />
    </OrderWizardProvider>
  )
}

// Export step components for direct use if needed
export { CustomerSelectionStep, DishSelectionStep, ConfirmationStep }
