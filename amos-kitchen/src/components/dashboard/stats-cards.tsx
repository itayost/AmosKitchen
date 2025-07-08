// components/dashboard/stats-cards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, DollarSign, TrendingUp } from 'lucide-react';
import { AnimatedNumber } from '../shared/animated-number';

interface StatsCardsProps {
  stats?: {
    totalOrders: number;
    activeCustomers: number;
    revenue: number;
    avgOrderValue: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'סך הזמנות',
      value: stats?.totalOrders || 0,
      icon: Package,
      trend: '+12% מהשבוע שעבר',
      prefix: '',
    },
    {
      title: 'לקוחות פעילים',
      value: stats?.activeCustomers || 0,
      icon: Users,
      trend: '+5 חדשים השבוע',
      prefix: '',
    },
    {
      title: 'הכנסות',
      value: stats?.revenue || 0,
      icon: DollarSign,
      trend: '+8% מהשבוע שעבר',
      prefix: '₪',
    },
    {
      title: 'הזמנה ממוצעת',
      value: stats?.avgOrderValue || 0,
      icon: TrendingUp,
      trend: '+₪15 מהשבוע שעבר',
      prefix: '₪',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={card.title}
            className="transition-all duration-300 hover:shadow-lg animate-in slide-in-from-bottom"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedNumber 
                  value={card.value} 
                  prefix={card.prefix}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {card.trend}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
