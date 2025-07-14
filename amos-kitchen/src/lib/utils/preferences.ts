// lib/utils/preferences.ts
import { PreferenceType, CustomerPreference } from '@/lib/types/database'
import { AlertTriangle, Utensils, Heart, Stethoscope, LucideIcon } from 'lucide-react'

// Preference type configuration
export interface PreferenceConfig {
    label: string
    hebrewLabel: string
    color: 'destructive' | 'warning' | 'secondary' | 'default'
    icon: LucideIcon
    priority: number
}

export const PREFERENCE_CONFIGS: Record<PreferenceType, PreferenceConfig> = {
    ALLERGY: {
        label: 'Allergy',
        hebrewLabel: 'אלרגיה',
        color: 'destructive',
        icon: AlertTriangle,
        priority: 1
    },
    MEDICAL: {
        label: 'Medical',
        hebrewLabel: 'רפואי',
        color: 'destructive',
        icon: Stethoscope,
        priority: 2
    },
    DIETARY_RESTRICTION: {
        label: 'Dietary Restriction',
        hebrewLabel: 'הגבלה תזונתית',
        color: 'warning',
        icon: Utensils,
        priority: 3
    },
    PREFERENCE: {
        label: 'Preference',
        hebrewLabel: 'העדפה',
        color: 'secondary',
        icon: Heart,
        priority: 4
    }
}

// Common dietary preferences/restrictions for autocomplete
export const COMMON_PREFERENCES = {
    ALLERGY: [
        'בוטנים',
        'אגוזים',
        'גלוטן',
        'חלב',
        'ביצים',
        'סויה',
        'דגים',
        'פירות ים',
        'שומשום'
    ],
    DIETARY_RESTRICTION: [
        'כשר',
        'צמחוני',
        'טבעוני',
        'ללא גלוטן',
        'ללא לקטוז',
        'חלאל',
        'דל נתרן',
        'דל שומן'
    ],
    PREFERENCE: [
        'ללא חריף',
        'ללא בצל',
        'ללא שום',
        'ללא עגבניות',
        'מעדיף אורגני',
        'ללא חומרים משמרים'
    ],
    MEDICAL: [
        'סוכרת',
        'לחץ דם גבוה',
        'צליאק',
        'IBS',
        'כולסטרול גבוה'
    ]
}

// Helper functions
export function getPreferenceConfig(type: PreferenceType): PreferenceConfig {
    return PREFERENCE_CONFIGS[type]
}

export function groupPreferencesByType(preferences: CustomerPreference[]): Record<PreferenceType, CustomerPreference[]> {
    const grouped = {
        ALLERGY: [],
        MEDICAL: [],
        DIETARY_RESTRICTION: [],
        PREFERENCE: []
    } as Record<PreferenceType, CustomerPreference[]>

    preferences.forEach(pref => {
        grouped[pref.type].push(pref)
    })

    return grouped
}

export function sortPreferencesByPriority(preferences: CustomerPreference[]): CustomerPreference[] {
    return [...preferences].sort((a, b) => {
        const priorityA = PREFERENCE_CONFIGS[a.type].priority
        const priorityB = PREFERENCE_CONFIGS[b.type].priority
        return priorityA - priorityB
    })
}

export function hasHighPriorityPreferences(preferences: CustomerPreference[]): boolean {
    return preferences.some(pref => 
        pref.type === 'ALLERGY' || pref.type === 'MEDICAL'
    )
}

export function getPreferenceSummary(preferences: CustomerPreference[]): string {
    if (preferences.length === 0) return ''
    
    const grouped = groupPreferencesByType(preferences)
    const summary: string[] = []
    
    if (grouped.ALLERGY.length > 0) {
        summary.push(`אלרגיות: ${grouped.ALLERGY.map(p => p.value).join(', ')}`)
    }
    if (grouped.MEDICAL.length > 0) {
        summary.push(`רפואי: ${grouped.MEDICAL.map(p => p.value).join(', ')}`)
    }
    if (grouped.DIETARY_RESTRICTION.length > 0) {
        summary.push(`הגבלות: ${grouped.DIETARY_RESTRICTION.map(p => p.value).join(', ')}`)
    }
    if (grouped.PREFERENCE.length > 0) {
        summary.push(`העדפות: ${grouped.PREFERENCE.map(p => p.value).join(', ')}`)
    }
    
    return summary.join(' | ')
}

// Validation functions
export function validatePreferenceValue(value: string): boolean {
    return value.trim().length >= 2 && value.trim().length <= 50
}

export function isDuplicatePreference(
    preferences: CustomerPreference[],
    type: PreferenceType,
    value: string,
    excludeId?: string
): boolean {
    return preferences.some(pref => 
        pref.type === type && 
        pref.value.toLowerCase() === value.toLowerCase() &&
        pref.id !== excludeId
    )
}
