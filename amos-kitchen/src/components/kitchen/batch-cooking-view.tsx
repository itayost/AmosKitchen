'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// Define types locally instead of importing from Prisma
type DishCategory = 'APPETIZER' | 'MAIN' | 'SIDE' | 'DESSERT' | 'BEVERAGE';
import { ChefHat, Utensils, Coffee, Cookie, Salad, Info, Users, AlertCircle } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from '@/lib/utils';

interface DishAggregation {
  id: string
  name: string
  category: string
  totalQuantity: number
  orderCount: number
  orders: {
    orderId: string
    orderNumber: string
    customerName: string
    quantity: number
    notes?: string
  }[]
}

interface BatchCookingViewProps {
  dishes: DishAggregation[]
  orders: any[] // or define proper Order type
}

export function BatchCookingView({ dishes, orders }: BatchCookingViewProps) {
  const [expandedDishes, setExpandedDishes] = useState<string[]>([]);

  const toggleDish = (dishId: string) => {
    setExpandedDishes(prev =>
      prev.includes(dishId)
        ? prev.filter(id => id !== dishId)
        : [...prev, dishId]
    );
  };

  const categoryConfig = {
    APPETIZER: {
      label: 'מנות ראשונות',
      icon: <Salad className="h-5 w-5" />,
      color: 'bg-green-50 border-green-200',
      badge: 'bg-green-100 text-green-800'
    },
    MAIN: {
      label: 'מנות עיקריות',
      icon: <Utensils className="h-5 w-5" />,
      color: 'bg-red-50 border-red-200',
      badge: 'bg-red-100 text-red-800'
    },
    SIDE: {
      label: 'תוספות',
      icon: <ChefHat className="h-5 w-5" />,
      color: 'bg-blue-50 border-blue-200',
      badge: 'bg-blue-100 text-blue-800'
    },
    DESSERT: {
      label: 'קינוחים',
      icon: <Cookie className="h-5 w-5" />,
      color: 'bg-purple-50 border-purple-200',
      badge: 'bg-purple-100 text-purple-800'
    },
    BEVERAGE: {
      label: 'משקאות',
      icon: <Coffee className="h-5 w-5" />,
      color: 'bg-yellow-50 border-yellow-200',
      badge: 'bg-yellow-100 text-yellow-800'
    }
  };

  // Default config for unknown categories
  const defaultCategoryConfig = {
    label: 'אחר',
    icon: <Utensils className="h-5 w-5" />,
    color: 'bg-gray-50 border-gray-200',
    badge: 'bg-gray-100 text-gray-800'
  };

  // Filter out dishes with invalid categories
  const validDishes = dishes.filter(dish => {
    if (!dish.category) {
      console.warn('Dish without category:', dish);
      return false;
    }
    return true;
  });

  const dishesByCategory = validDishes.reduce((acc, dish) => {
    const category = dish.category || 'OTHER';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(dish);
    return acc;
  }, {} as Record<string, DishAggregation[]>);

  // Calculate category totals
  const categoryTotals = Object.entries(dishesByCategory).map(([category, dishes]) => ({
    category,
    totalQuantity: dishes.reduce((sum, dish) => sum + dish.totalQuantity, 0),
    dishCount: dishes.length
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {categoryTotals.map(({ category, totalQuantity, dishCount }) => {
          const config = categoryConfig[category as keyof typeof categoryConfig] || defaultCategoryConfig;

          return (
            <Card key={category} className={cn("p-4", config.color)}>
              <div className="flex items-center justify-between mb-2">
                {config.icon}
                <span className="text-2xl font-bold">{totalQuantity}</span>
              </div>
              <p className="text-sm font-medium">{config.label}</p>
              <p className="text-xs text-muted-foreground">{dishCount} סוגים</p>
            </Card>
          );
        })}
      </div>

      {/* Dishes by Category */}
      {Object.entries(dishesByCategory).map(([category, categoryDishes]) => {
        const config = categoryConfig[category as keyof typeof categoryConfig] || defaultCategoryConfig;

        return (
          <Card key={category} className="overflow-hidden">
            <div className={cn("p-4 border-b", config.color)}>
              <h3 className="font-bold text-lg flex items-center gap-2">
                {config.icon}
                {config.label}
                <Badge variant="secondary" className={config.badge}>
                  {categoryDishes.reduce((sum, dish) => sum + dish.totalQuantity, 0)} פריטים
                </Badge>
              </h3>
            </div>

            <div className="p-4 space-y-3">
              {categoryDishes.map((dish) => (
                <Collapsible
                  key={dish.id}
                  open={expandedDishes.includes(dish.id)}
                  onOpenChange={() => toggleDish(dish.id)}
                >
                  {/* Rest of your collapsible content remains the same */}
                  <Card className="overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full p-4 justify-between hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-lg">{dish.name}</span>
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {dish.orderCount} הזמנות
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-bold text-blue-600">
                            ×{dish.totalQuantity}
                          </span>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t p-4 bg-gray-50">
                        <h4 className="font-medium mb-3 text-sm text-muted-foreground">
                          פירוט לפי הזמנות:
                        </h4>
                        <div className="space-y-2">
                          {dish.orders.map((order, idx) => (
                            <div
                              key={idx}
                              className="flex items-start justify-between text-sm bg-white p-2 rounded"
                            >
                              <div className="flex-1">
                                <span className="font-medium">
                                  {order.customerName}
                                </span>
                                <span className="text-muted-foreground ml-2">
                                  (#{order.orderNumber})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                  ×{order.quantity}
                                </Badge>
                                {order.notes && (
                                  <div className="flex items-center text-orange-600">
                                    <AlertCircle className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Special Notes */}
                        {dish.orders.some(o => o.notes) && (
                          <div className="mt-3 pt-3 border-t">
                            <h4 className="font-medium mb-2 text-sm text-orange-600 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              הוראות מיוחדות:
                            </h4>
                            <div className="space-y-1">
                              {dish.orders
                                .filter(o => o.notes)
                                .map((order, idx) => (
                                  <p key={idx} className="text-sm bg-orange-50 p-2 rounded">
                                    <strong>{order.customerName}:</strong> {order.notes}
                                  </p>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          </Card>
        );
      })}

      {/* Print Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="no-print"
        >
          הדפס רשימת בישול
        </Button>
      </div>
    </div>
  );
}
