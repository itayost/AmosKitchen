// components/customers/customer-preference-card.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Info } from 'lucide-react'
import { PreferenceBadgeGroup } from './preference-badge'
import { PREFERENCE_CONFIGS } from '@/lib/utils/preferences'
import type { Customer, CustomerPreference } from '@/lib/types/database'

interface CustomerPreferenceCardProps {
    customer: Customer & { preferences?: CustomerPreference[] }
    variant?: 'default' | 'compact' | 'inline'
    showTitle?: boolean
    className?: string
}

export function CustomerPreferenceCard({ 
    customer, 
    variant = 'default',
    showTitle = true,
    className 
}: CustomerPreferenceCardProps) {
    if (!customer.preferences || customer.preferences.length === 0) {
        return null
    }

    const criticalPrefs = customer.preferences.filter(
        p => p.type === 'ALLERGY' || p.type === 'MEDICAL'
    )
    const regularPrefs = customer.preferences.filter(
        p => p.type !== 'ALLERGY' && p.type !== 'MEDICAL'
    )

    if (variant === 'inline') {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                {criticalPrefs.length > 0 && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
                <PreferenceBadgeGroup 
                    preferences={customer.preferences}
                    maxVisible={3}
                    showIcon={true}
                />
            </div>
        )
    }

    if (variant === 'compact') {
        return (
            <div className={`p-3 rounded-md bg-muted/50 space-y-2 ${className}`}>
                {criticalPrefs.length > 0 && (
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                        <div className="flex-1 space-y-1">
                            {criticalPrefs.map(pref => (
                                <div key={pref.id} className="text-sm">
                                    <span className="font-medium text-destructive">
                                        {PREFERENCE_CONFIGS[pref.type].hebrewLabel}:
                                    </span>{' '}
                                    {pref.value}
                                    {pref.notes && (
                                        <span className="text-muted-foreground"> ({pref.notes})</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {regularPrefs.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        <PreferenceBadgeGroup 
                            preferences={regularPrefs}
                            maxVisible={5}
                            showIcon={false}
                        />
                    </div>
                )}
            </div>
        )
    }

    // Default full card variant
    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                {showTitle && (
                    <CardTitle className="text-base flex items-center justify-between">
                        <span>העדפות - {customer.name}</span>
                        <Badge variant="outline">{customer.preferences.length}</Badge>
                    </CardTitle>
                )}
            </CardHeader>
            <CardContent className="space-y-3">
                {criticalPrefs.length > 0 && (
                    <div className="p-3 rounded-md bg-red-50 border border-red-200 space-y-2">
                        <div className="flex items-center gap-2 text-red-800 font-medium text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            הגבלות קריטיות
                        </div>
                        {criticalPrefs.map(pref => (
                            <div key={pref.id} className="text-sm text-red-700">
                                <span className="font-medium">
                                    {PREFERENCE_CONFIGS[pref.type].hebrewLabel}:
                                </span>{' '}
                                {pref.value}
                                {pref.notes && (
                                    <span className="text-red-600"> - {pref.notes}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                
                {regularPrefs.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Info className="h-4 w-4" />
                            העדפות נוספות
                        </div>
                        <PreferenceBadgeGroup 
                            preferences={regularPrefs}
                            maxVisible={10}
                            showIcon={true}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Quick preference summary for tooltips or compact displays
export function CustomerPreferenceSummary({ 
    customer 
}: { 
    customer: Customer & { preferences?: CustomerPreference[] } 
}) {
    if (!customer.preferences || customer.preferences.length === 0) {
        return <span className="text-muted-foreground">אין העדפות מיוחדות</span>
    }

    const critical = customer.preferences.filter(
        p => p.type === 'ALLERGY' || p.type === 'MEDICAL'
    )
    
    const summary = critical.length > 0
        ? critical.map(p => p.value).join(', ')
        : customer.preferences.slice(0, 3).map(p => p.value).join(', ')

    return (
        <span className={critical.length > 0 ? 'text-destructive font-medium' : ''}>
            {summary}
            {customer.preferences.length > 3 && ` (+${customer.preferences.length - 3})`}
        </span>
    )
}
