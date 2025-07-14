// lib/validators/customer.ts
import { z } from 'zod'
import { PreferenceType } from '@/lib/types/database'

// Preference validation schemas
export const preferenceTypeSchema = z.enum(['ALLERGY', 'DIETARY_RESTRICTION', 'PREFERENCE', 'MEDICAL'])

export const customerPreferenceSchema = z.object({
    id: z.string().optional(),
    type: preferenceTypeSchema,
    value: z.string().min(2, 'הערך חייב להכיל לפחות 2 תווים').max(50, 'הערך לא יכול להכיל יותר מ-50 תווים'),
    notes: z.string().max(200, 'ההערות לא יכולות להכיל יותר מ-200 תווים').nullable().optional()
})

export const createCustomerPreferenceSchema = customerPreferenceSchema.omit({ id: true })

// Customer validation schemas
export const createCustomerSchema = z.object({
    name: z.string().min(2, 'השם חייב להכיל לפחות 2 תווים').max(100, 'השם לא יכול להכיל יותר מ-100 תווים'),
    phone: z.string().min(9, 'מספר טלפון חייב להכיל לפחות 9 ספרות').max(15, 'מספר טלפון לא תקין'),
    email: z.string().email('כתובת אימייל לא תקינה').nullable().optional(),
    address: z.string().max(200, 'הכתובת לא יכולה להכיל יותר מ-200 תווים').nullable().optional(),
    notes: z.string().max(500, 'ההערות לא יכולות להכיל יותר מ-500 תווים').nullable().optional(),
    preferences: z.array(createCustomerPreferenceSchema).optional().default([])
})

export const updateCustomerSchema = createCustomerSchema.partial().extend({
    preferences: z.array(customerPreferenceSchema).optional()
})

// Type inference
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type CustomerPreferenceInput = z.infer<typeof customerPreferenceSchema>

// Custom validation functions
export function validatePhoneNumber(phone: string): boolean {
    // Israeli phone number validation
    const phoneRegex = /^(\+972|0)([23489]|5[012345689]|7[0-9])[0-9]{7}$/
    const cleanPhone = phone.replace(/[\s-()]/g, '')
    return phoneRegex.test(cleanPhone)
}

export function normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let normalized = phone.replace(/[^\d+]/g, '')
    
    // Convert 972 prefix to 0
    if (normalized.startsWith('+972')) {
        normalized = '0' + normalized.slice(4)
    } else if (normalized.startsWith('972')) {
        normalized = '0' + normalized.slice(3)
    }
    
    // Format as 05X-XXXXXXX
    if (normalized.length === 10 && normalized.startsWith('0')) {
        return `${normalized.slice(0, 3)}-${normalized.slice(3)}`
    }
    
    return phone
}

// Preference-specific validation
export function validatePreferences(preferences: CustomerPreferenceInput[]): string[] {
    const errors: string[] = []
    const seen = new Set<string>()
    
    preferences.forEach((pref, index) => {
        const key = `${pref.type}-${pref.value.toLowerCase()}`
        
        if (seen.has(key)) {
            errors.push(`העדפה כפולה בשורה ${index + 1}: ${pref.value}`)
        }
        seen.add(key)
        
        if (pref.value.trim().length < 2) {
            errors.push(`ערך קצר מדי בשורה ${index + 1}`)
        }
        
        if (pref.value.trim().length > 50) {
            errors.push(`ערך ארוך מדי בשורה ${index + 1}`)
        }
    })
    
    return errors
}
