'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
// Define types locally instead of importing from Prisma
type OrderStatus = 'NEW' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryDate: Date | any;
  deliveryAddress?: string | null;
  notes?: string | null;
  totalAmount: number;
  createdAt: Date | any;
  updatedAt: Date | any;
};
import { Phone, MapPin, AlertCircle, CheckCircle2, Clock, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CookingOrderCardProps {
  order: Order & {
    customer: {
      name: string;
      phone: string;
      address: string | null;
      notes: string | null;
    };
    orderItems: Array<{
      id: string;
      quantity: number;
      price: number;
      notes: string | null;
      dish: {
        name: string;
        category: string;
      };
    }>;
  };
  onStatusChange: (status: OrderStatus) => void;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
}

export function CookingOrderCard({
  order,
  onStatusChange,
  isSelected,
  onSelect
}: CookingOrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    await onStatusChange(newStatus);
    setIsUpdating(false);
  };

  const toggleItemCheck = (itemId: string) => {
    setCheckedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const allItemsChecked = checkedItems.length === order.orderItems.length;

  const statusConfig = {
    NEW: {
      color: 'bg-gray-50 border-gray-300',
      badge: 'default',
      icon: <Package className="h-4 w-4" />
    },
    CONFIRMED: {
      color: 'bg-blue-50 border-blue-300',
      badge: 'default',
      icon: <Package className="h-4 w-4" />
    },
    PREPARING: {
      color: 'bg-yellow-50 border-yellow-300',
      badge: 'secondary',
      icon: <Clock className="h-4 w-4" />
    },
    READY: {
      color: 'bg-green-50 border-green-300',
      badge: 'default',
      icon: <CheckCircle2 className="h-4 w-4" />
    },
    DELIVERED: {
      color: 'bg-purple-50 border-purple-300',
      badge: 'default',
      icon: <CheckCircle2 className="h-4 w-4" />
    },
    CANCELLED: {
      color: 'bg-red-50 border-red-300',
      badge: 'destructive',
      icon: <AlertCircle className="h-4 w-4" />
    },
  };

  const config = statusConfig[order.status as keyof typeof statusConfig];

  return (
    <Card className={cn(
      "relative transition-all",
      config.color,
      isSelected && "ring-2 ring-blue-500"
    )}>
      <div className="absolute top-3 right-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(checked as boolean)}
        />
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="pr-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg">
              Order #{order.orderNumber}
            </h3>
            <Badge variant={config.badge as any} className="flex items-center gap-1">
              {config.icon}
              {order.status}
            </Badge>
          </div>

          <div className="space-y-1 text-sm">
            <p className="font-medium">{order.customer.name}</p>
            <p className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
              {order.customer.phone}
            </p>
            {order.customer.address && (
              <p className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {order.customer.address}
              </p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-2 border-t pt-3">
          {order.orderItems.map((item) => (
            <div key={item.id} className="flex items-start gap-2">
              <Checkbox
                checked={checkedItems.includes(item.id) || order.status === 'READY' || order.status === 'DELIVERED'}
                onCheckedChange={() => toggleItemCheck(item.id)}
                disabled={order.status === 'READY' || order.status === 'DELIVERED'}
              />
              <div className="flex-1">
                <span className={cn(
                  "text-sm",
                  (checkedItems.includes(item.id) || order.status === 'READY' || order.status === 'DELIVERED') && "line-through text-muted-foreground"
                )}>
                  <strong>{item.quantity}×</strong> {item.dish.name}
                </span>
                {item.notes && (
                  <p className="text-xs text-orange-600 mt-0.5">
                    📝 {item.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Order Notes */}
        {(order.notes || order.customer.notes) && (
          <div className="bg-yellow-100 border border-yellow-200 p-2 rounded text-sm">
            {order.notes && (
              <p className="flex items-start gap-1">
                <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span><strong>Order:</strong> {order.notes}</span>
              </p>
            )}
            {order.customer.notes && (
              <p className="flex items-start gap-1 mt-1">
                <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span><strong>Customer:</strong> {order.customer.notes}</span>
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {order.status === 'NEW' && (
            <Button
              onClick={() => handleStatusChange('PREPARING')}
              disabled={isUpdating}
              className="flex-1"
              size="sm"
            >
              Start Preparing
            </Button>
          )}
          {order.status === 'CONFIRMED' && (
            <Button
              onClick={() => handleStatusChange('PREPARING')}
              disabled={isUpdating}
              className="flex-1"
              size="sm"
            >
              Start Preparing
            </Button>
          )}
          {order.status === 'PREPARING' && (
            <Button
              onClick={() => handleStatusChange('READY')}
              disabled={isUpdating || !allItemsChecked}
              variant={allItemsChecked ? "default" : "outline"}
              className="flex-1"
              size="sm"
            >
              {allItemsChecked ? 'Mark as Ready' : `Check all items (${checkedItems.length}/${order.orderItems.length})`}
            </Button>
          )}
          {order.status === 'READY' && (
            <Button
              onClick={() => handleStatusChange('DELIVERED')}
              disabled={isUpdating}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              Mark Delivered
            </Button>
          )}
        </div>

        {/* Total */}
        <div className="pt-2 border-t text-right">
          <p className="text-sm font-medium">
            Total: ${order.totalAmount.toFixed(2)}
          </p>
        </div>
      </div>
    </Card>
  );
}
