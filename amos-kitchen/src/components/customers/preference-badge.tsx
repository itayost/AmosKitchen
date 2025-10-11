// components/customers/preference-badge.tsx
'use client'

import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Utensils, Heart, Stethoscope } from 'lucide-react'
import { PreferenceType, CustomerPreference } from '@/lib/types/database'
import { PREFERENCE_CONFIGS } from '@/lib/utils/preferences'
import { cn } from '@/lib/utils'

interface PreferenceBadgeProps {
    preference: CustomerPreference
    showIcon?: boolean
    className?: string
    onClick?: () => void
}

export function PreferenceBadge({
    preference,
    showIcon = true,
    className,
    onClick
}: PreferenceBadgeProps) {
    const config = PREFERENCE_CONFIGS[preference.type]

    // Handle invalid/undefined preference types
    if (!config) {
        console.warn(`Invalid preference type: ${preference.type}`, preference)
        return null
    }

    const Icon = config.icon

    const variantMap = {
        destructive: 'destructive',
        warning: 'secondary',
        secondary: 'secondary',
        default: 'default'
    } as const

    return (
        <Badge
            variant={variantMap[config.color] || 'default'}
            className={cn(
                'gap-1',
                onClick && 'cursor-pointer hover:opacity-80',
                className
            )}
            onClick={onClick}
            title={preference.notes || undefined}
        >
            {showIcon && <Icon className="h-3 w-3" />}
            {preference.value}
        </Badge>
    )
}

interface PreferenceBadgeGroupProps {
    preferences: CustomerPreference[]
    maxVisible?: number
    showIcon?: boolean
    className?: string
}

export function PreferenceBadgeGroup({
    preferences,
    maxVisible = 3,
    showIcon = true,
    className
}: PreferenceBadgeGroupProps) {
    if (!preferences || preferences.length === 0) return null

    // Filter out preferences with invalid types
    const validPreferences = preferences.filter(pref => {
        const hasValidType = pref.type && PREFERENCE_CONFIGS[pref.type]
        if (!hasValidType) {
            console.warn(`Filtering out invalid preference:`, pref)
        }
        return hasValidType
    })

    if (validPreferences.length === 0) return null

    const sortedPreferences = [...validPreferences].sort((a, b) => {
        const priorityA = PREFERENCE_CONFIGS[a.type].priority
        const priorityB = PREFERENCE_CONFIGS[b.type].priority
        return priorityA - priorityB
    })

    const visiblePreferences = sortedPreferences.slice(0, maxVisible)
    const hiddenCount = validPreferences.length - maxVisible

    return (
        <div className={cn('flex flex-wrap gap-1', className)}>
            {visiblePreferences.map((pref) => (
                <PreferenceBadge
                    key={pref.id}
                    preference={pref}
                    showIcon={showIcon}
                />
            ))}
            {hiddenCount > 0 && (
                <Badge variant="outline" className="text-muted-foreground">
                    +{hiddenCount} נוספים
                </Badge>
            )}
        </div>
    )
}

interface CriticalPreferenceAlertProps {
    preferences: CustomerPreference[]
    className?: string
}

export function CriticalPreferenceAlert({ preferences, className }: CriticalPreferenceAlertProps) {
    const criticalPrefs = preferences.filter(
        pref => pref.type === 'ALLERGY' || pref.type === 'MEDICAL'
    )

    if (criticalPrefs.length === 0) return null

    return (
        <div className={cn(
            'flex items-start gap-2 p-3 rounded-md',
            'bg-red-50 border border-red-200',
            className
        )}>
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                    שים לב להגבלות קריטיות:
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                    {criticalPrefs.map((pref) => (
                        <span key={pref.id} className="text-sm text-red-700">
                            • {PREFERENCE_CONFIGS[pref.type].hebrewLabel}: {pref.value}
                            {pref.notes && ` (${pref.notes})`}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}
