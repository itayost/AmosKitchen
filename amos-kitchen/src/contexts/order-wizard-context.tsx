'use client'

import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  ReactNode
} from 'react'
import type { Customer, Dish, CustomerPreference } from '@/lib/types/database'
import { hasHighPriorityPreferences } from '@/lib/utils/preferences'
import {
  getNextAvailableFriday as _getNextAvailableFriday,
  getAvailableFridays as _getAvailableFridays
} from '@/lib/utils/friday-dates'

// Re-export for backward compatibility
export const getNextAvailableFriday = _getNextAvailableFriday
export const getAvailableFridays = _getAvailableFridays

// Types
export interface CustomerWithPreferences extends Customer {
  preferences?: CustomerPreference[]
}

export interface OrderItemInput {
  dishId: string
  quantity: number
  price: number
  notes: string
}

export interface OrderWizardState {
  currentStep: 1 | 2 | 3
  customer: CustomerWithPreferences | null
  deliveryDate: Date
  deliveryAddress: string
  items: OrderItemInput[]
  notes: string
  isSubmitting: boolean
  submitError: string | null
}

// Actions
type WizardAction =
  | { type: 'SET_CUSTOMER'; payload: CustomerWithPreferences }
  | { type: 'CLEAR_CUSTOMER' }
  | { type: 'SET_DELIVERY_DATE'; payload: Date }
  | { type: 'SET_DELIVERY_ADDRESS'; payload: string }
  | { type: 'SET_ITEMS'; payload: OrderItemInput[] }
  | { type: 'ADD_ITEM' }
  | { type: 'UPDATE_ITEM'; payload: { index: number; updates: Partial<OrderItemInput> } }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'GO_TO_STEP'; payload: 1 | 2 | 3 }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_SUBMIT_ERROR'; payload: string | null }
  | { type: 'RESET' }
  | { type: 'INIT_FROM_CUSTOMER'; payload: CustomerWithPreferences }
  | { type: 'INIT_FROM_DUPLICATE'; payload: { customer: CustomerWithPreferences; items: OrderItemInput[]; notes: string } }

// Helper: Generate preference warning for notes
function getPreferenceWarningNotes(preferences?: CustomerPreference[]): string {
  if (!preferences || preferences.length === 0) return ''

  const critical = preferences.filter(p => p.type === 'ALLERGY' || p.type === 'MEDICAL')
  if (critical.length === 0) return ''

  return `⚠️ שים לב: ${critical.map(p => `${p.type === 'ALLERGY' ? 'אלרגיה' : 'רפואי'} - ${p.value}`).join(', ')}`
}

// Initial state factory (fresh date calculation on each call)
function createInitialState(): OrderWizardState {
  return {
    currentStep: 1,
    customer: null,
    deliveryDate: _getNextAvailableFriday(),
    deliveryAddress: '',
    items: [{ dishId: '', quantity: 1, price: 0, notes: '' }],
    notes: '',
    isSubmitting: false,
    submitError: null
  }
}

// Reducer
function wizardReducer(state: OrderWizardState, action: WizardAction): OrderWizardState {
  switch (action.type) {
    case 'SET_CUSTOMER':
      return {
        ...state,
        customer: action.payload,
        deliveryAddress: action.payload.address || state.deliveryAddress,
        notes: getPreferenceWarningNotes(action.payload.preferences)
      }

    case 'CLEAR_CUSTOMER':
      return {
        ...state,
        customer: null,
        deliveryAddress: '',
        notes: ''
      }

    case 'SET_DELIVERY_DATE':
      return {
        ...state,
        deliveryDate: action.payload
      }

    case 'SET_DELIVERY_ADDRESS':
      return {
        ...state,
        deliveryAddress: action.payload
      }

    case 'SET_ITEMS':
      return {
        ...state,
        items: action.payload
      }

    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, { dishId: '', quantity: 1, price: 0, notes: '' }]
      }

    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map((item, index) =>
          index === action.payload.index
            ? { ...item, ...action.payload.updates }
            : item
        )
      }

    case 'REMOVE_ITEM':
      if (state.items.length <= 1) return state
      return {
        ...state,
        items: state.items.filter((_, index) => index !== action.payload)
      }

    case 'SET_NOTES':
      return {
        ...state,
        notes: action.payload
      }

    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: action.payload
      }

    case 'NEXT_STEP':
      if (state.currentStep >= 3) return state
      return {
        ...state,
        currentStep: (state.currentStep + 1) as 1 | 2 | 3
      }

    case 'PREV_STEP':
      if (state.currentStep <= 1) return state
      return {
        ...state,
        currentStep: (state.currentStep - 1) as 1 | 2 | 3
      }

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload
      }

    case 'SET_SUBMIT_ERROR':
      return {
        ...state,
        submitError: action.payload
      }

    case 'RESET':
      return createInitialState()

    case 'INIT_FROM_CUSTOMER':
      return {
        ...state,
        customer: action.payload,
        deliveryAddress: action.payload.address || '',
        notes: getPreferenceWarningNotes(action.payload.preferences),
        currentStep: 2 // Skip to step 2
      }

    case 'INIT_FROM_DUPLICATE':
      return {
        ...state,
        customer: action.payload.customer,
        deliveryAddress: action.payload.customer.address || '',
        items: action.payload.items.length > 0 ? action.payload.items : [{ dishId: '', quantity: 1, price: 0, notes: '' }],
        notes: action.payload.notes || getPreferenceWarningNotes(action.payload.customer.preferences),
        deliveryDate: _getNextAvailableFriday(),
        currentStep: 2 // Start at step 2 since customer is selected
      }

    default:
      return state
  }
}

// Context value type
interface OrderWizardContextValue {
  // State
  state: OrderWizardState

  // Computed values
  total: number
  isStep1Valid: boolean
  isStep2Valid: boolean
  canProceed: boolean
  hasCriticalPreferences: boolean

  // Customer actions
  setCustomer: (customer: CustomerWithPreferences) => void
  clearCustomer: () => void

  // Delivery actions
  setDeliveryDate: (date: Date) => void
  setDeliveryAddress: (address: string) => void

  // Item actions
  setItems: (items: OrderItemInput[]) => void
  addItem: () => void
  updateItem: (index: number, updates: Partial<OrderItemInput>) => void
  removeItem: (index: number) => void

  // Notes action
  setNotes: (notes: string) => void

  // Navigation actions
  goToStep: (step: 1 | 2 | 3) => void
  nextStep: () => void
  prevStep: () => void

  // Submit actions
  setSubmitting: (isSubmitting: boolean) => void
  setSubmitError: (error: string | null) => void
  reset: () => void

  // Initialization actions
  initFromCustomer: (customer: CustomerWithPreferences) => void
  initFromDuplicate: (customer: CustomerWithPreferences, items: OrderItemInput[], notes: string) => void
}

// Create context
const OrderWizardContext = createContext<OrderWizardContextValue | null>(null)

// Provider props
interface OrderWizardProviderProps {
  children: ReactNode
  dishes: Dish[]
}

// Provider component
export function OrderWizardProvider({ children, dishes }: OrderWizardProviderProps) {
  const [state, dispatch] = useReducer(wizardReducer, null, createInitialState)

  // Compute total from items and dishes
  const total = useMemo(() => {
    return state.items.reduce((sum, item) => {
      if (!item.dishId) return sum
      const dish = dishes.find(d => d.id === item.dishId)
      return sum + (dish ? dish.price * item.quantity : item.price * item.quantity)
    }, 0)
  }, [state.items, dishes])

  // Validation: Step 1 (Customer selection)
  const isStep1Valid = useMemo(() => {
    return state.customer !== null
  }, [state.customer])

  // Validation: Step 2 (Dishes selection)
  const isStep2Valid = useMemo(() => {
    const hasValidItems = state.items.length > 0 &&
      state.items.some(item => item.dishId !== '' && item.quantity > 0)
    return hasValidItems
  }, [state.items])

  // Can proceed to next step
  const canProceed = useMemo(() => {
    switch (state.currentStep) {
      case 1:
        return isStep1Valid
      case 2:
        return isStep2Valid
      case 3:
        return true
      default:
        return false
    }
  }, [state.currentStep, isStep1Valid, isStep2Valid])

  // Has critical preferences (allergies/medical)
  const hasCriticalPreferences = useMemo(() => {
    if (!state.customer?.preferences) return false
    return hasHighPriorityPreferences(state.customer.preferences)
  }, [state.customer?.preferences])

  // Actions
  const setCustomer = useCallback((customer: CustomerWithPreferences) => {
    dispatch({ type: 'SET_CUSTOMER', payload: customer })
  }, [])

  const clearCustomer = useCallback(() => {
    dispatch({ type: 'CLEAR_CUSTOMER' })
  }, [])

  const setDeliveryDate = useCallback((date: Date) => {
    dispatch({ type: 'SET_DELIVERY_DATE', payload: date })
  }, [])

  const setDeliveryAddress = useCallback((address: string) => {
    dispatch({ type: 'SET_DELIVERY_ADDRESS', payload: address })
  }, [])

  const setItems = useCallback((items: OrderItemInput[]) => {
    dispatch({ type: 'SET_ITEMS', payload: items })
  }, [])

  const addItem = useCallback(() => {
    dispatch({ type: 'ADD_ITEM' })
  }, [])

  const updateItem = useCallback((index: number, updates: Partial<OrderItemInput>) => {
    dispatch({ type: 'UPDATE_ITEM', payload: { index, updates } })
  }, [])

  const removeItem = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: index })
  }, [])

  const setNotes = useCallback((notes: string) => {
    dispatch({ type: 'SET_NOTES', payload: notes })
  }, [])

  const goToStep = useCallback((step: 1 | 2 | 3) => {
    dispatch({ type: 'GO_TO_STEP', payload: step })
  }, [])

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' })
  }, [])

  const prevStep = useCallback(() => {
    dispatch({ type: 'PREV_STEP' })
  }, [])

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    dispatch({ type: 'SET_SUBMITTING', payload: isSubmitting })
  }, [])

  const setSubmitError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_SUBMIT_ERROR', payload: error })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const initFromCustomer = useCallback((customer: CustomerWithPreferences) => {
    dispatch({ type: 'INIT_FROM_CUSTOMER', payload: customer })
  }, [])

  const initFromDuplicate = useCallback((customer: CustomerWithPreferences, items: OrderItemInput[], notes: string) => {
    dispatch({ type: 'INIT_FROM_DUPLICATE', payload: { customer, items, notes } })
  }, [])

  // Memoize context value
  const contextValue = useMemo<OrderWizardContextValue>(() => ({
    state,
    total,
    isStep1Valid,
    isStep2Valid,
    canProceed,
    hasCriticalPreferences,
    setCustomer,
    clearCustomer,
    setDeliveryDate,
    setDeliveryAddress,
    setItems,
    addItem,
    updateItem,
    removeItem,
    setNotes,
    goToStep,
    nextStep,
    prevStep,
    setSubmitting,
    setSubmitError,
    reset,
    initFromCustomer,
    initFromDuplicate
  }), [
    state,
    total,
    isStep1Valid,
    isStep2Valid,
    canProceed,
    hasCriticalPreferences,
    setCustomer,
    clearCustomer,
    setDeliveryDate,
    setDeliveryAddress,
    setItems,
    addItem,
    updateItem,
    removeItem,
    setNotes,
    goToStep,
    nextStep,
    prevStep,
    setSubmitting,
    setSubmitError,
    reset,
    initFromCustomer,
    initFromDuplicate
  ])

  return (
    <OrderWizardContext.Provider value={contextValue}>
      {children}
    </OrderWizardContext.Provider>
  )
}

// Hook to use the context
export function useOrderWizard(): OrderWizardContextValue {
  const context = useContext(OrderWizardContext)
  if (!context) {
    throw new Error('useOrderWizard must be used within OrderWizardProvider')
  }
  return context
}
