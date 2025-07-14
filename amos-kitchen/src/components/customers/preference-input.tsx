// components/customers/preference-input.tsx
'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { PreferenceType, CustomerPreference } from '@/lib/types/database'
import { PREFERENCE_CONFIGS, COMMON_PREFERENCES } from '@/lib/utils/preferences'
import { PreferenceBadge } from './preference-badge'
import { cn } from '@/lib/utils'

interface PreferenceInputProps {
    preferences: Partial<CustomerPreference>[]
    onChange: (preferences: Partial<CustomerPreference>[]) => void
    errors?: Record<string, string>
}

export function PreferenceInput({ preferences, onChange, errors }: PreferenceInputProps) {
    const [newPreference, setNewPreference] = useState<{
        type: PreferenceType | ''
        value: string
        notes: string
    }>({
        type: '',
        value: '',
        notes: ''
    })
    const [showSuggestions, setShowSuggestions] = useState(false)

    const handleAddPreference = () => {
        if (!newPreference.type || !newPreference.value.trim()) return

        const isDuplicate = preferences.some(
            p => p.type === newPreference.type && 
            p.value?.toLowerCase() === newPreference.value.toLowerCase()
        )

        if (isDuplicate) {
            return // Could show error message
        }

        onChange([
            ...preferences,
            {
                type: newPreference.type as PreferenceType,
                value: newPreference.value.trim(),
                notes: newPreference.notes.trim() || null
            }
        ])

        // Reset form
        setNewPreference({ type: '', value: '', notes: '' })
    }

    const handleRemovePreference = (index: number) => {
        onChange(preferences.filter((_, i) => i !== index))
    }

    const getSuggestionsForType = (type: PreferenceType): string[] => {
        return COMMON_PREFERENCES[type] || []
    }

    const filteredSuggestions = newPreference.type
        ? getSuggestionsForType(newPreference.type as PreferenceType).filter(
            suggestion => 
                suggestion.toLowerCase().includes(newPreference.value.toLowerCase()) &&
                !preferences.some(p => 
                    p.type === newPreference.type && 
                    p.value?.toLowerCase() === suggestion.toLowerCase()
                )
        )
        : []

    return (
        <div className="space-y-4">
            <div>
                <Label>העדפות והגבלות תזונתיות</Label>
                <p className="text-sm text-muted-foreground">
                    הוסף מידע על אלרגיות, הגבלות תזונתיות, העדפות אישיות או מצבים רפואיים
                </p>
            </div>

            {/* Existing preferences */}
            {preferences.length > 0 && (
                <div className="space-y-2">
                    {preferences.map((pref, index) => (
                        <div 
                            key={index} 
                            className="flex items-start gap-2 p-3 bg-muted/50 rounded-md"
                        >
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <PreferenceBadge 
                                        preference={pref as CustomerPreference}
                                        showIcon={true}
                                    />
                                    <span className="text-sm font-medium">{pref.value}</span>
                                </div>
                                {pref.notes && (
                                    <p className="text-sm text-muted-foreground">
                                        {pref.notes}
                                    </p>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemovePreference(index)}
                                className="h-8 w-8"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add new preference form */}
            <div className="space-y-3 border rounded-md p-4">
                <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="preference-type">סוג</Label>
                            <Select
                                value={newPreference.type}
                                onValueChange={(value) => 
                                    setNewPreference(prev => ({ ...prev, type: value as PreferenceType }))
                                }
                            >
                                <SelectTrigger id="preference-type">
                                    <SelectValue placeholder="בחר סוג" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PREFERENCE_CONFIGS).map(([type, config]) => (
                                        <SelectItem key={type} value={type}>
                                            <div className="flex items-center gap-2">
                                                <config.icon className="h-4 w-4" />
                                                {config.hebrewLabel}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="preference-value">ערך</Label>
                            <Popover open={showSuggestions && filteredSuggestions.length > 0}>
                                <PopoverTrigger asChild>
                                    <Input
                                        id="preference-value"
                                        value={newPreference.value}
                                        onChange={(e) => {
                                            setNewPreference(prev => ({ ...prev, value: e.target.value }))
                                            setShowSuggestions(true)
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        placeholder="לדוגמה: בוטנים, צמחוני, ללא גלוטן"
                                        disabled={!newPreference.type}
                                    />
                                </PopoverTrigger>
                                <PopoverContent className="p-0" align="start">
                                    <Command>
                                        <CommandEmpty>אין הצעות</CommandEmpty>
                                        <CommandGroup>
                                            {filteredSuggestions.map((suggestion) => (
                                                <CommandItem
                                                    key={suggestion}
                                                    value={suggestion}
                                                    onSelect={() => {
                                                        setNewPreference(prev => ({ 
                                                            ...prev, 
                                                            value: suggestion 
                                                        }))
                                                        setShowSuggestions(false)
                                                    }}
                                                >
                                                    {suggestion}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="preference-notes">הערות (אופציונלי)</Label>
                        <Textarea
                            id="preference-notes"
                            value={newPreference.notes}
                            onChange={(e) => 
                                setNewPreference(prev => ({ ...prev, notes: e.target.value }))
                            }
                            placeholder="הערות נוספות או הסברים"
                            rows={2}
                            disabled={!newPreference.type}
                        />
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddPreference}
                        disabled={!newPreference.type || !newPreference.value.trim()}
                        className="w-full"
                    >
                        <Plus className="h-4 w-4 ml-2" />
                        הוסף העדפה
                    </Button>
                </div>
            </div>

            {errors?.preferences && (
                <p className="text-sm text-destructive">{errors.preferences}</p>
            )}
        </div>
    )
}
