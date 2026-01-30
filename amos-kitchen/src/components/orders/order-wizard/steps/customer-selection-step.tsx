'use client'

import { useState, useMemo } from 'react'
import { User, Search, AlertTriangle, ChevronLeft } from 'lucide-react'
import { useOrderWizard, CustomerWithPreferences } from '@/contexts/order-wizard-context'
import { useRecentCustomers } from '@/lib/hooks/use-recent-customers'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { CriticalPreferenceAlert, PreferenceBadgeGroup } from '@/components/customers/preference-badge'
import { CustomerPreferenceCard } from '@/components/customers/customer-preference-card'

interface CustomerSelectionStepProps {
  customers: CustomerWithPreferences[]
}

export function CustomerSelectionStep({ customers }: CustomerSelectionStepProps) {
  const {
    state,
    setCustomer,
    clearCustomer,
    nextStep,
    canProceed,
    hasCriticalPreferences
  } = useOrderWizard()

  const { recentCustomers, isLoading: loadingRecent } = useRecentCustomers(5)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPreferenceDetails, setShowPreferenceDetails] = useState(false)

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers

    const query = searchQuery.toLowerCase()
    return customers.filter(customer =>
      customer.name?.toLowerCase().includes(query) ||
      customer.phone?.includes(searchQuery) ||
      customer.email?.toLowerCase().includes(query)
    )
  }, [customers, searchQuery])

  // Handle customer selection
  const handleSelectCustomer = (customer: CustomerWithPreferences) => {
    setCustomer(customer)
    setSearchQuery('')

    // Auto-expand preferences if customer has critical ones
    if (customer.preferences?.some(p => p.type === 'ALLERGY' || p.type === 'MEDICAL')) {
      setShowPreferenceDetails(true)
    }
  }

  // Handle clear selection
  const handleClearSelection = () => {
    clearCustomer()
    setShowPreferenceDetails(false)
  }

  // Check if customer has critical preferences
  const customerHasCriticalPrefs = (customer: CustomerWithPreferences) => {
    return customer.preferences?.some(p => p.type === 'ALLERGY' || p.type === 'MEDICAL')
  }

  return (
    <div className="space-y-6">
      {/* Recent Customers Quick Pick */}
      {!state.customer && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">לקוחות תדירים</CardTitle>
            <CardDescription>בחר מהלקוחות שהזמינו הכי הרבה לאחרונה</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRecent ? (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-10 w-24 rounded-md" />
                ))}
              </div>
            ) : recentCustomers.length > 0 ? (
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  {recentCustomers.map(customer => (
                    <Button
                      key={customer.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectCustomer(customer)}
                      className="flex-shrink-0 gap-2"
                    >
                      <User className="h-4 w-4" />
                      {customer.name}
                      {customerHasCriticalPrefs(customer) && (
                        <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center">
                          !
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">אין לקוחות תדירים עדיין</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Customer Search */}
      {!state.customer && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">חיפוש לקוח</CardTitle>
            <CardDescription>חפש לפי שם, טלפון או אימייל</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש לקוח..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-right"
                dir="rtl"
              />
            </div>

            {/* Customer List */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredCustomers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'לא נמצאו לקוחות' : 'אין לקוחות במערכת'}
                  </p>
                ) : (
                  filteredCustomers.map(customer => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{customer.name}</span>
                            {customerHasCriticalPrefs(customer) && (
                              <Badge variant="destructive" className="h-5 px-1 gap-1">
                                <AlertTriangle className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {customer.phone}
                            {customer.email && ` • ${customer.email}`}
                          </div>
                        </div>
                      </div>
                      {customer.preferences && customer.preferences.length > 0 && (
                        <Badge variant="secondary" className="mr-2">
                          {customer.preferences.length} העדפות
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Selected Customer Display */}
      {state.customer && (
        <Card className="border-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">לקוח נבחר</CardTitle>
                {hasCriticalPreferences && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    הגבלות קריטיות
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
              >
                שנה לקוח
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Info */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{state.customer.name}</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>{state.customer.phone}</div>
                  {state.customer.email && <div>{state.customer.email}</div>}
                  {state.customer.address && <div>{state.customer.address}</div>}
                </div>
              </div>
            </div>

            {/* Critical Preferences Alert */}
            {hasCriticalPreferences && state.customer.preferences && (
              <CriticalPreferenceAlert
                preferences={state.customer.preferences}
                className="mt-4"
              />
            )}

            {/* All Preferences */}
            {state.customer.preferences && state.customer.preferences.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">העדפות הלקוח</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreferenceDetails(!showPreferenceDetails)}
                    >
                      {showPreferenceDetails ? 'הסתר' : 'הצג'} פרטים
                    </Button>
                  </div>

                  {showPreferenceDetails ? (
                    <CustomerPreferenceCard
                      customer={state.customer}
                      variant="compact"
                      showTitle={false}
                    />
                  ) : (
                    <PreferenceBadgeGroup
                      preferences={state.customer.preferences}
                      maxVisible={10}
                      showIcon={true}
                    />
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-4">
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
