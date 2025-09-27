// components/customers/preference-input.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
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
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const [justSelected, setJustSelected] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const suggestionsRef = useRef<HTMLButtonElement[]>([])

    // Get suggestions for current type
    const getSuggestionsForType = (type: PreferenceType): string[] => {
        return COMMON_PREFERENCES[type] || []
    }

    const filteredSuggestions = newPreference.type
        ? getSuggestionsForType(newPreference.type as PreferenceType)
            .filter(suggestion =>
                suggestion.toLowerCase().includes(newPreference.value.toLowerCase())
            )
        : []

    // Handle clicks outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                inputRef.current &&
                !inputRef.current.contains(event.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false)
                setHighlightedIndex(-1)
                setJustSelected(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || filteredSuggestions.length === 0) return

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setHighlightedIndex(prev =>
                    prev < filteredSuggestions.length - 1 ? prev + 1 : 0
                )
                break
            case 'ArrowUp':
                e.preventDefault()
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredSuggestions.length - 1
                )
                break
            case 'Enter':
                e.preventDefault()
                if (highlightedIndex >= 0) {
                    selectSuggestion(filteredSuggestions[highlightedIndex])
                } else if (newPreference.value.trim()) {
                    handleAddPreference()
                }
                break
            case 'Escape':
                e.preventDefault()
                setShowSuggestions(false)
                setHighlightedIndex(-1)
                break
        }
    }

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightedIndex >= 0 && suggestionsRef.current[highlightedIndex]) {
            suggestionsRef.current[highlightedIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            })
        }
    }, [highlightedIndex])

    const selectSuggestion = (suggestion: string) => {
        setNewPreference(prev => ({ ...prev, value: suggestion }))
        setShowSuggestions(false)
        setHighlightedIndex(-1)
        setJustSelected(true)
        // Reset the flag after a short delay
        setTimeout(() => setJustSelected(false), 100)
    }

    const handleAddPreference = () => {
        if (!newPreference.type || !newPreference.value.trim()) return

        const isDuplicate = preferences.some(
            p => p.type === newPreference.type &&
                p.value?.toLowerCase() === newPreference.value.toLowerCase()
        )

        if (isDuplicate) {
            // Could show error message here
            return
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
        setShowSuggestions(false)
        setHighlightedIndex(-1)
        setJustSelected(false)
    }

    const handleRemovePreference = (index: number) => {
        onChange(preferences.filter((_, i) => i !== index))
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label>העדפות תזונתיות</Label>
                {preferences.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                        {preferences.length} העדפות
                    </span>
                )}
            </div>

            {/* Existing preferences */}
            {preferences.length > 0 && (
                <div className="space-y-2">
                    {preferences.map((pref, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-2 p-3 border rounded-md bg-muted/30"
                        >
                            <div className="flex-1 space-y-1">
                                <PreferenceBadge
                                    preference={{
                                        type: pref.type as PreferenceType,
                                        value: pref.value!,
                                        notes: pref.notes
                                    } as CustomerPreference}
                                />
                                {pref.notes && (
                                    <p className="text-sm text-muted-foreground mr-6">
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
                        {/* Type selection */}
                        <div>
                            <Label htmlFor="preference-type">סוג</Label>
                            <Select
                                value={newPreference.type}
                                onValueChange={(value) => {
                                    setNewPreference(prev => ({ ...prev, type: value as PreferenceType }))
                                    // Clear value when type changes
                                    setNewPreference(prev => ({ ...prev, value: '' }))
                                    setShowSuggestions(false)
                                    setHighlightedIndex(-1)
                                    setJustSelected(false)
                                }}
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

                        {/* Value input with suggestions */}
                        <div className="relative">
                            <Label htmlFor="preference-value">ערך</Label>
                            <Input
                                ref={inputRef}
                                id="preference-value"
                                value={newPreference.value}
                                onChange={(e) => {
                                    setNewPreference(prev => ({ ...prev, value: e.target.value }))
                                    if (!justSelected) {
                                        setShowSuggestions(true)
                                        setHighlightedIndex(-1)
                                    }
                                }}
                                onFocus={() => {
                                    if (!justSelected && newPreference.type && filteredSuggestions.length > 0) {
                                        setShowSuggestions(true)
                                    }
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={
                                    newPreference.type
                                        ? `הזן ${PREFERENCE_CONFIGS[newPreference.type as PreferenceType].hebrewLabel}`
                                        : 'בחר סוג קודם'
                                }
                                disabled={!newPreference.type}
                                autoComplete="off"
                                className={cn(
                                    showSuggestions && filteredSuggestions.length > 0 && "rounded-b-none"
                                )}
                            />

                            {/* Suggestions dropdown */}
                            {showSuggestions && filteredSuggestions.length > 0 && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute z-50 w-full -mt-[1px] bg-background border border-t-0 rounded-b-md shadow-lg max-h-[200px] overflow-y-auto"
                                >
                                    {filteredSuggestions.map((suggestion, index) => (
                                        <button
                                            key={suggestion}
                                            ref={el => {
                                                if (el) suggestionsRef.current[index] = el
                                            }}
                                            type="button"
                                            className={cn(
                                                "w-full px-3 py-2 text-right transition-colors focus:outline-none",
                                                highlightedIndex === index
                                                    ? "bg-accent text-accent-foreground"
                                                    : "hover:bg-accent/50"
                                            )}
                                            onClick={() => selectSuggestion(suggestion)}
                                            onMouseDown={(e) => {
                                                // Prevent input from losing focus
                                                e.preventDefault()
                                            }}
                                            onMouseEnter={() => setHighlightedIndex(index)}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
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

                    {/* Add button */}
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
