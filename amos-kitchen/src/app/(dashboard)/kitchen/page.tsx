import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { KitchenDashboard } from '@/components/kitchen/kitchen-dashboard';
import { getOrdersForToday } from '@/lib/actions/orders';
import { Loader2 } from 'lucide-react';
import type { Order } from '@/lib/types/database'

export const metadata = {
  title: 'מטבח - הזמנות להיום',
  description: 'ניהול הזמנות להיום לבישול ומשלוח',
};

export default async function KitchenPage() {
  let todayOrders: Awaited<ReturnType<typeof getOrdersForToday>> = [];

  try {
    todayOrders = await getOrdersForToday();
    if (!Array.isArray(todayOrders)) {
      console.error('getOrdersForToday did not return an array:', todayOrders);
      todayOrders = [];
    }
  } catch (error) {
    console.error('Error fetching today\'s orders:', error);
    todayOrders = [];
  }

  return (
    <div className="h-full bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">לוח בקרה למטבח - {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h1>

        <Suspense
          fallback={
            <Card className="p-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>טוען הזמנות להיום...</span>
            </Card>
          }
        >
          <KitchenDashboard orders={todayOrders} />
        </Suspense>
      </div>
    </div>
  );
}
