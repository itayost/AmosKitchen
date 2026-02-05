// app/(dashboard)/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Settings, Truck, Save, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useSettings, useUpdateSettings } from '@/lib/hooks/use-settings'
import { useToast } from '@/lib/hooks/use-toast'

export default function SettingsPage() {
    const { settings, isLoading } = useSettings()
    const { updateSettings, isUpdating } = useUpdateSettings()
    const { toast } = useToast()
    const [deliveryFee, setDeliveryFee] = useState<string>('')

    // Initialize form value from settings
    useEffect(() => {
        if (!isLoading) {
            setDeliveryFee(settings.deliveryFee.toString())
        }
    }, [settings.deliveryFee, isLoading])

    const handleSave = async () => {
        const fee = parseFloat(deliveryFee)
        if (isNaN(fee) || fee < 0) {
            toast({
                title: 'שגיאה',
                description: 'דמי משלוח חייבים להיות מספר חיובי',
                variant: 'destructive'
            })
            return
        }

        try {
            await updateSettings({ deliveryFee: fee })
            toast({
                title: 'ההגדרות נשמרו',
                description: 'דמי המשלוח עודכנו בהצלחה'
            })
        } catch {
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לשמור את ההגדרות',
                variant: 'destructive'
            })
        }
    }

    const hasChanges = !isLoading && parseFloat(deliveryFee) !== settings.deliveryFee

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Settings className="h-8 w-8" />
                    הגדרות
                </h1>
                <p className="text-muted-foreground">
                    ניהול הגדרות המערכת
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        דמי משלוח
                    </CardTitle>
                    <CardDescription>
                        הגדר את עלות המשלוח שתתווסף להזמנות עם משלוח. איסוף עצמי הוא תמיד ללא עלות.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <Skeleton className="h-10 w-48" />
                    ) : (
                        <>
                            <div className="space-y-2 max-w-xs">
                                <Label htmlFor="deliveryFee">דמי משלוח (₪)</Label>
                                <Input
                                    id="deliveryFee"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={deliveryFee}
                                    onChange={(e) => setDeliveryFee(e.target.value)}
                                    disabled={isUpdating}
                                    className="text-right"
                                    dir="rtl"
                                />
                            </div>
                            <Button
                                onClick={handleSave}
                                disabled={isUpdating || !hasChanges}
                                className="gap-2"
                            >
                                {isUpdating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                שמור שינויים
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
