'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { Dish } from '@/lib/types/database'
import type { UseFormReturn } from 'react-hook-form'

interface OrderItem {
  dishId: string
  quantity: number
  notes?: string
}

interface OrderItemsCardProps {
  form: UseFormReturn<any>
  items: OrderItem[]
  dishes: Dish[]
}

export function OrderItemsCard({ form, items, dishes }: OrderItemsCardProps) {
  const addItem = () => {
    const currentItems = form.getValues('items')
    form.setValue('items', [...currentItems, { dishId: '', quantity: 1, notes: '' }])
  }

  const removeItem = (index: number) => {
    const currentItems = form.getValues('items')
    if (currentItems.length > 1) {
      form.setValue('items', currentItems.filter((_: any, i: number) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...form.getValues('items')]
    newItems[index] = { ...newItems[index], [field]: value }
    form.setValue('items', newItems)
  }

  const getItemSubtotal = (item: OrderItem): number => {
    const dish = dishes.find(d => d.id === item.dishId)
    return dish ? dish.price * item.quantity : 0
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>פריטי הזמנה</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="space-y-3 p-4 border rounded-lg">
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-6">
                <Label>מנה</Label>
                <Select
                  value={item.dishId}
                  onValueChange={(value) => updateItem(index, 'dishId', value)}
                >
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="בחר מנה" />
                  </SelectTrigger>
                  <SelectContent>
                    {dishes.map((dish) => (
                      <SelectItem key={dish.id} value={dish.id} className="text-right">
                        <div className="flex items-center justify-between w-full">
                          <span>{dish.name}</span>
                          <span className="text-muted-foreground ml-2">
                            ₪{dish.price}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label>כמות</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  className="text-center"
                />
              </div>

              <div className="md:col-span-3">
                <Label>הערות</Label>
                <Input
                  placeholder="הערות למנה"
                  value={item.notes || ''}
                  onChange={(e) => updateItem(index, 'notes', e.target.value)}
                  className="text-right"
                />
              </div>

              <div className="md:col-span-1 flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Dish subtotal */}
            {item.dishId && (
              <div className="text-sm text-muted-foreground text-right">
                סה״כ למנה: ₪{getItemSubtotal(item)}
              </div>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="w-full"
        >
          <Plus className="h-4 w-4 ml-2" />
          הוסף מנה
        </Button>
      </CardContent>
    </Card>
  )
}
