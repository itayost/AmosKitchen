import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { KitchenDashboard } from '@/components/kitchen/kitchen-dashboard';
import { getOrdersForNextDelivery } from '@/lib/actions/orders';
import { Loader2 } from 'lucide-react';
import type { Order } from '@/lib/types/database'

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'מטבח - הזמנות',
  description: 'ניהול הזמנות לבישול ומשלוח',
};

export default async function KitchenPage() {
  let nextDeliveryData: { orders: any[], deliveryDate: Date | null } = { orders: [], deliveryDate: null };

  try {
    nextDeliveryData = await getOrdersForNextDelivery();
    if (!Array.isArray(nextDeliveryData.orders)) {
      console.error('getOrdersForNextDelivery did not return an array:', nextDeliveryData);
      nextDeliveryData = { orders: [], deliveryDate: null };
    }
  } catch (error) {
    console.error('Error fetching next delivery orders:', error);
    nextDeliveryData = { orders: [], deliveryDate: null };
  }

  const deliveryDateString = nextDeliveryData.deliveryDate
    ? new Date(nextDeliveryData.deliveryDate).toLocaleDateString('he-IL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'אין הזמנות עתידיות';

  return (
    <div className="h-full bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <Suspense
          fallback={
            <Card className="p-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>טוען הזמנות...</span>
            </Card>
          }
        >
          <KitchenDashboard
            initialOrders={nextDeliveryData.orders as any}
            deliveryDate={nextDeliveryData.deliveryDate}
          />
        </Suspense>
      </div>
    </div>
  );
}
