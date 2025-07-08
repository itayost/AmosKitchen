'use client';

// components/dashboard/recent-orders.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '../shared/status-badge';
import { cn } from '@/lib/utils';

interface RecentOrdersProps {
  orders?: Array<{
    id: string;
    customer: string;
    amount: number;
    status: string;
    time: string;
  }>;
  className?: string;
}

export function RecentOrders({ orders, className }: RecentOrdersProps) {
  return (
    <Card className={cn("transition-all duration-300", className)}>
      <CardHeader>
        <CardTitle>הזמנות אחרונות</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders?.map((order, index) => (
            <div 
              key={order.id} 
              className="flex items-center justify-between animate-in slide-in-from-right duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {order.customer.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">{order.customer}</p>
                  <p className="text-sm text-muted-foreground">{order.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">₪{order.amount}</span>
                <StatusBadge status={order.status} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
