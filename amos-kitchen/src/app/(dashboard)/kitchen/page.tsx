import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { KitchenDashboardV2 } from '@/components/kitchen/kitchen-dashboard-v2';
import { getOrdersForNextDelivery } from '@/lib/actions/orders';
import { Loader2 } from 'lucide-react';

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
          <KitchenDashboardV2
            initialOrders={nextDeliveryData.orders as any}
            deliveryDate={nextDeliveryData.deliveryDate}
          />
        </Suspense>
      </div>
    </div>
  );
}
