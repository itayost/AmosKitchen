// src/app/(dashboard)/ingredients/[id]/edit/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { IngredientDialog } from '@/components/ingredients/ingredient-dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useToast } from '@/lib/hooks/use-toast'
import type { Ingredient } from '@/lib/types/database'

export default function EditIngredientPage() {
    const params = useParams()
    const router = useRouter()
    const ingredientId = params.id as string
    const { toast } = useToast()

    const [ingredient, setIngredient] = useState<Ingredient | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchIngredient()
    }, [ingredientId])

    const fetchIngredient = async () => {
        try {
            const response = await fetch(`/api/ingredients/${ingredientId}`)
            if (!response.ok) throw new Error('Failed to fetch ingredient')

            const data = await response.json()
            setIngredient(data)
        } catch (error) {
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לטעון את פרטי הרכיב',
                variant: 'destructive'
            })
            router.push('/ingredients')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        // The dialog handles the save internally, so just navigate on success
        router.push('/ingredients')
    }

    if (loading) return <LoadingSpinner />
    if (!ingredient) return null

    return (
        <IngredientDialog
            open={true}
            onOpenChange={(open) => {
                if (!open) router.push('/ingredients')
            }}
            ingredient={ingredient}
            onSave={handleSave}
        />
    )
}
