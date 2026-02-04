// components/shared/status-badge.tsx
import { ChefHat, Package, Truck, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
}

export const statusConfig = {
  PREPARING: {
    label: 'בהכנה',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    icon: ChefHat
  },
  READY: {
    label: 'מוכן',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    icon: Package
  },
  DELIVERED: {
    label: 'נמסר',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    icon: Truck
  },
  CANCELLED: {
    label: 'בוטל',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    icon: X
  }
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PREPARING;
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
