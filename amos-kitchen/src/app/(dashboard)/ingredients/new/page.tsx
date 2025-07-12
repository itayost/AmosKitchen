// src/app/(dashboard)/ingredients/new/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { IngredientDialog } from '@/components/ingredients/ingredient-dialog'

export default function NewIngredientPage() {
    const router = useRouter()

    const handleSave = async () => {
        // Dialog handles the POST request internally
        router.push('/ingredients')
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
