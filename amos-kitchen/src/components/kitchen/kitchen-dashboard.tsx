'use client';

import { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus, DishCategory } from '@prisma/client';
import { updateOrderStatus, bulkUpdateOrderStatus } from '@/lib/actions/orders';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KitchenHeader } from './kitchen-header';
import { CookingOrderCard } from './cooking-order-card';
import { BatchCookingView } from './batch-cooking-view';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Search, Filter } from 'lucide-react';
import { Decimal } from '@prisma/client/runtime/library';
import { useToast } from '@/lib/hooks/use-toast';

interface OrderWithDetails {
  id: string
  orderNumber: string
  customerId: string
  customer: {
    id: string
    name: string
    phone: string
    email?: string | null
    address: string | null
    notes: string | null
  }
  createdAt: Date
  updatedAt: Date
  orderDate: Date
  deliveryDate: Date
  deliveryAddress: string | null
  status: OrderStatus
  totalAmount: Decimal  // Change from any to Decimal
  notes: string | null
  orderItems: {
    id: string
    quantity: number
    price: Decimal  // Change from number to Decimal
    notes: string | null
    dish: {
      id: string
      name: string
      category: string | null  // Change back to allow null
    }
  }[]
}

interface KitchenDashboardProps {
  orders: OrderWithDetails[];
}

export function KitchenDashboard({ orders: initialOrders }: KitchenDashboardProps) {
  // Ensure orders is always an array
  const safeOrders = Array.isArray(initialOrders) ? initialOrders : [];

  const [orders, setOrders] = useState(safeOrders);
  const [view, setView] = useState<'orders' | 'batch'>('orders');
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/orders/today');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setOrders(data);
        toast({
          title: "רוענן",
          description: "ההזמנות עודכנו בהצלחה",
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: "שגיאה",
        description: "נכשל רענון ההזמנות",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [toast]);

  // Fetch fresh data when component mounts
  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [handleRefresh]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      toast({
        title: "הסטטוס עודכן",
        description: `סטטוס ההזמנה שונה ל-${newStatus}`,
      });
    } else {
      toast({
        title: "שגיאה",
        description: "נכשל עדכון סטטוס ההזמנה",
        variant: "destructive",
      });
    }
  };

  const handleBulkStatusChange = async (newStatus: OrderStatus) => {
    if (selectedOrders.length === 0) {
      toast({
        title: "לא נבחרו הזמנות",
        description: "אנא בחר הזמנות לעדכון",
        variant: "destructive",
      });
      return;
    }

    const result = await bulkUpdateOrderStatus(selectedOrders, newStatus);
    if (result.success) {
      setOrders(orders.map(order =>
        selectedOrders.includes(order.id) ? { ...order, status: newStatus } : order
      ));
      setSelectedOrders([]);
      toast({
        title: "עדכון קבוצתי הצליח",
        description: `${selectedOrders.length} הזמנות עודכנו ל-${newStatus}`,
      });
    } else {
      toast({
        title: "שגיאה",
        description: "נכשל עדכון ההזמנות",
        variant: "destructive",
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = searchTerm === '' ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const dishAggregation = aggregateDishes(orders);

  return (
    <div className="space-y-4">
      <KitchenHeader orders={orders} />

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש לפי שם לקוח או מספר הזמנה..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filter} onValueChange={(value) => setFilter(value as OrderStatus | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="סינון לפי סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל ההזמנות</SelectItem>
                <SelectItem value="NEW">חדש</SelectItem>
                <SelectItem value="CONFIRMED">מאושר</SelectItem>
                <SelectItem value="PREPARING">בהכנה</SelectItem>
                <SelectItem value="READY">מוכן</SelectItem>
                <SelectItem value="DELIVERED">נמסר</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            רענון
          </Button>
        </div>

        {selectedOrders.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedOrders.length} הזמנות נבחרו
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusChange('PREPARING')}
                >
                  התחל הכנה לכולם
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusChange('READY')}
                >
                  סמן הכל כמוכן
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedOrders([])}
                >
                  נקה בחירה
                </Button>
              </div>
            </div>
          </div>
        )}

        <Tabs value={view} onValueChange={(v) => setView(v as 'orders' | 'batch')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">
              <span className="flex items-center gap-2">
                לפי הזמנה
                <Badge variant="secondary">{filteredOrders.length}</Badge>
              </span>
            </TabsTrigger>
            <TabsTrigger value="batch">
              <span className="flex items-center gap-2">
                בישול קבוצתי
                <Badge variant="secondary">{dishAggregation.length}</Badge>
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map((order) => (
                <CookingOrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={(status) => handleStatusChange(order.id, status)}
                  isSelected={selectedOrders.includes(order.id)}
                  onSelect={(selected) => {
                    if (selected) {
                      setSelectedOrders([...selectedOrders, order.id]);
                    } else {
                      setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                    }
                  }}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="batch" className="mt-4">
            <BatchCookingView dishes={dishAggregation} orders={orders} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function aggregateDishes(orders: OrderWithDetails[]) {
  const dishMap = new Map<string, {
    id: string;
    name: string;
    category: DishCategory;
    totalQuantity: number;
    orderCount: number;
    orders: Array<{
      orderNumber: string;
      customerName: string;
      quantity: number;
      notes: string | null;
    }>;
  }>();

  orders.forEach(order => {
    order.orderItems.forEach(item => {
      const existing = dishMap.get(item.dish.id);

      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.orderCount += 1;
        existing.orders.push({
          orderNumber: order.orderNumber,
          customerName: order.customer.name,
          quantity: item.quantity,
          notes: item.notes
        });
      } else {
        dishMap.set(item.dish.id, {
          id: item.dish.id,
          name: item.dish.name,
          category: item.dish.category,
          totalQuantity: item.quantity,
          orderCount: 1,
          orders: [{
            orderNumber: order.orderNumber,
            customerName: order.customer.name,
            quantity: item.quantity,
            notes: item.notes
          }]
        });
      }
    });
  });

  return Array.from(dishMap.values()).sort((a, b) => {
    // Sort by category first, then by quantity
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return b.totalQuantity - a.totalQuantity;
  });
}
