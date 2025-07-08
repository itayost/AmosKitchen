// src/app/(dashboard)/ingredients/new/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { IngredientDialog } from '@/components/ingredients/ingredient-dialog'
import { useToast } from '@/lib/hooks/use-toast'
import type { Ingredient } from '@/lib/types/database'

export default function NewIngredientPage() {
    const router = useRouter()
    const { toast } = useToast()

    const handleSave = async (ingredientData: Partial<Ingredient>) => {
        try {
            const response = await fetch('/api/ingredients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ingredientData)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create ingredient')
            }

            toast({
                title: 'הצלחה',
                description: 'הרכיב נוסף בהצלחה'
            })
            router.push('/ingredients')
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: error instanceof Error ? error.message : 'לא ניתן ליצור את הרכיב',
                variant: 'destructive'
            })
        }
    }

    return (
        <IngredientDialog
            open={true}
            onOpenChange={(open) => {
                if (!open) router.push('/ingredients')
            }}
            ingredient={null}
            onSave={handleSave}
        />
    )
}
