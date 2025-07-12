'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Package, CheckCircle2, AlertCircle, Timer } from 'lucide-react';
import { Order, OrderStatus } from '@prisma/client';

interface KitchenHeaderProps {
  orders: Array<Order & {
    orderItems: Array<{
      quantity: number;
      dish: {
        name: string;
      };
    }>;
  }>;
}

export function KitchenHeader({ orders }: KitchenHeaderProps) {
  const stats = calculateStats(orders);
  const progress = (stats.readyOrders + stats.deliveredOrders) / stats.totalOrders * 100;
  
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            {new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })}
          </h2>
          <Badge variant="outline" className="text-lg px-3 py-1">
            <Timer className="h-4 w-4 mr-1" />
            יום שישי - יום משלוחים
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Package className="h-5 w-5" />}
            label="סה״כ הזמנות"
            value={stats.totalOrders}
            color="blue"
          />
          <StatCard
            icon={<AlertCircle className="h-5 w-5" />}
            label="להכין"
            value={stats.newOrders + stats.confirmedOrders}
            color="orange"
          />
          <StatCard
            icon={<Timer className="h-5 w-5" />}
            label="בהכנה"
            value={stats.preparingOrders}
            color="yellow"
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="מוכן"
            value={stats.readyOrders}
            color="green"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>התקדמות כללית</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill
            status="חדש"
            count={stats.newOrders}
            color="bg-gray-100 text-gray-800"
          />
          <StatusPill
            status="מאושר"
            count={stats.confirmedOrders}
            color="bg-blue-100 text-blue-800"
          />
          <StatusPill
            status="בהכנה"
            count={stats.preparingOrders}
            color="bg-yellow-100 text-yellow-800"
          />
          <StatusPill
            status="מוכן"
            count={stats.readyOrders}
            color="bg-green-100 text-green-800"
          />
          <StatusPill
            status="נמסר"
            count={stats.deliveredOrders}
            color="bg-purple-100 text-purple-800"
          />
        </div>

        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>סה״כ מנות להכנה:</strong> {stats.totalDishes} פריטים
          </p>
        </div>
      </div>
    </Card>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    orange: 'bg-orange-50 text-orange-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    green: 'bg-green-50 text-green-700',
  };

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

function StatusPill({ 
  status, 
  count, 
  color 
}: { 
  status: string;
  count: number;
  color: string;
}) {
  if (count === 0) return null;
  
  return (
    <Badge variant="secondary" className={`${color} border-0`}>
      {status}: {count}
    </Badge>
  );
}

function calculateStats(orders: any[]) {
  const stats = {
    totalOrders: orders.length,
    totalDishes: 0,
    newOrders: 0,
    confirmedOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    deliveredOrders: 0,
  };

  orders.forEach(order => {
    stats.totalDishes += order.orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
    
    switch (order.status as OrderStatus) {
      case 'NEW':
        stats.newOrders++;
        break;
      case 'CONFIRMED':
        stats.confirmedOrders++;
        break;
      case 'PREPARING':
        stats.preparingOrders++;
        break;
      case 'READY':
        stats.readyOrders++;
        break;
      case 'DELIVERED':
        stats.deliveredOrders++;
        break;
    }
  });

  return stats;
}
