'use client'

import { useState } from 'react'
import { User, AlertTriangle, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { CriticalPreferenceAlert, PreferenceBadgeGroup } from '@/components/customers/preference-badge'
import { CustomerPreferenceCard } from '@/components/customers/customer-preference-card'
import type { Customer, CustomerPreference } from '@/lib/types/database'
import type { Control } from 'react-hook-form'

export interface CustomerWithPreferences extends Customer {
  preferences?: CustomerPreference[]
}

interface CustomerSelectionCardProps {
  control: Control<any>
  customers: CustomerWithPreferences[]
  selectedCustomer: CustomerWithPreferences | null
  onCustomerChange: (customerId: string) => void
}

export function CustomerSelectionCard({
  control,
  customers,
  selectedCustomer,
  onCustomerChange
}: CustomerSelectionCardProps) {
  const [customerSearch, setCustomerSearch] = useState('')
  const [showPreferenceDetails, setShowPreferenceDetails] = useState(false)

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => {
    if (!customerSearch) return true
    const searchLower = customerSearch.toLowerCase()
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(customerSearch) ||
      customer.email?.toLowerCase().includes(searchLower)
    )
  })

  const hasCriticalPreferences = (customer: CustomerWithPreferences | null) => {
    if (!customer?.preferences) return false
    return customer.preferences.some(p => p.type === 'ALLERGY' || p.type === 'MEDICAL')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>פרטי לקוח</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>בחר לקוח *</FormLabel>
              <Select onValueChange={(value) => {
                field.onChange(value)
                onCustomerChange(value)
              }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר לקוח מהרשימה">
                      {field.value && selectedCustomer && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{selectedCustomer.name}</span>
                          {hasCriticalPreferences(selectedCustomer) && (
                            <Badge variant="destructive" className="h-5 px-1">
                              <AlertTriangle className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="חיפוש לקוח..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {filteredCustomers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      <div className="flex items-center gap-2 w-full">
                        <span>{customer.name}</span>
                        {hasCriticalPreferences(customer) && (
                          <Badge variant="destructive" className="h-4 px-1 ml-auto">
                            !
                          </Badge>
                        )}
                        {customer.preferences && customer.preferences.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({customer.preferences.length} העדפות)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Customer Preferences Display */}
        {selectedCustomer && selectedCustomer.preferences && selectedCustomer.preferences.length > 0 && (
          <div className="space-y-3 animate-in slide-in-from-top-2">
            {hasCriticalPreferences(selectedCustomer) && (
              <CriticalPreferenceAlert
                preferences={selectedCustomer.preferences}
                className="shadow-sm"
              />
            )}

            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  העדפות הלקוח
                </h4>
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
                  customer={selectedCustomer}
                  variant="compact"
                  showTitle={false}
                />
              ) : (
                <PreferenceBadgeGroup
                  preferences={selectedCustomer.preferences}
                  maxVisible={10}
                  showIcon={true}
                />
              )}
            </div>
          </div>
        )}

        {/* Customer Contact Info */}
        {selectedCustomer && (
          <div className="grid gap-2 text-sm text-muted-foreground">
            <div>טלפון: {selectedCustomer.phone}</div>
            {selectedCustomer.email && <div>אימייל: {selectedCustomer.email}</div>}
            {selectedCustomer.address && <div>כתובת: {selectedCustomer.address}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
