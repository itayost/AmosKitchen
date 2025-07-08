// components/shared/status-badge.tsx
import { Clock, Check, ChefHat, Package, Truck, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
}

const statusConfig = {
  new: { 
    label: 'חדש',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', 
    icon: Clock 
  },
  confirmed: { 
    label: 'אושר',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', 
    icon: Check 
  },
  preparing: { 
    label: 'בהכנה',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', 
    icon: ChefHat 
  },
  ready: { 
    label: 'מוכן',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', 
    icon: Package 
  },
  delivered: { 
    label: 'נמסר',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300', 
    icon: Truck 
  },
  cancelled: { 
    label: 'בוטל',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', 
    icon: X 
  }
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300",
      config.color
    )}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
