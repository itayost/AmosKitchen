// lib/utils/type-guards.ts
import { PreferenceType, CustomerPreference, Customer } from '@/lib/types/database'

// Preference type guards
export function isValidPreferenceType(type: string): type is PreferenceType {
    return ['ALLERGY', 'DIETARY_RESTRICTION', 'PREFERENCE', 'MEDICAL'].includes(type)
}

export function isCustomerPreference(obj: any): obj is CustomerPreference {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.id === 'string' &&
        typeof obj.customerId === 'string' &&
        isValidPreferenceType(obj.type) &&
        typeof obj.value === 'string' &&
        (obj.notes === null || obj.notes === undefined || typeof obj.notes === 'string') &&
        obj.createdAt instanceof Date &&
        obj.updatedAt instanceof Date
    )
}

export function hasPreferences(customer: Customer): customer is Customer & { preferences: CustomerPreference[] } {
    return Array.isArray(customer.preferences) && customer.preferences.length > 0
}

export function hasAllergyPreferences(preferences: CustomerPreference[]): boolean {
    return preferences.some(pref => pref.type === 'ALLERGY')
}

export function hasMedicalPreferences(preferences: CustomerPreference[]): boolean {
    return preferences.some(pref => pref.type === 'MEDICAL')
}

export function hasCriticalPreferences(preferences: CustomerPreference[]): boolean {
    return hasAllergyPreferences(preferences) || hasMedicalPreferences(preferences)
}

// Type conversion helpers
export function toPreferenceType(value: string): PreferenceType | null {
    if (isValidPreferenceType(value)) {
        return value
    }
    
    // Handle lowercase or other variations
    const upperValue = value.toUpperCase()
    if (isValidPreferenceType(upperValue)) {
        return upperValue
    }
    
    // Handle common aliases
    const aliases: Record<string, PreferenceType> = {
        'allergy': 'ALLERGY',
        'dietary': 'DIETARY_RESTRICTION',
        'diet': 'DIETARY_RESTRICTION',
        'preference': 'PREFERENCE',
        'medical': 'MEDICAL',
        'health': 'MEDICAL'
    }
    
    const lowerValue = value.toLowerCase()
    if (aliases[lowerValue]) {
        return aliases[lowerValue]
    }
    
    return null
}

