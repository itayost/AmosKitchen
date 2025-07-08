'use client';

// components/dashboard/dashboard-content.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { StatsCards } from './stats-cards';
import { WeeklyChart } from './weekly-chart';
import { RecentOrders } from './recent-orders';
import { TopDishesChart } from './top-dishes-chart';
import { useDashboardData } from '@/lib/hooks/use-dashboard-data';

export function DashboardContent() {
  const { data, isLoading, error, isRefreshing, refresh } = useDashboardData();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (data) {
      setLastRefresh(new Date());
    }
  }, [data]);

  if (error && !data) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button 
              onClick={refresh} 
              variant="outline" 
              size="sm"
              className="ml-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              נסה שוב
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      {/* Header with Refresh */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          עדכון אחרון: {lastRefresh.toLocaleTimeString('he-IL')}
        </p>
        <Button 
          onClick={refresh} 
          variant="outline"
          size="sm"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          רענן
        </Button>
      </div>

      {/* Error Alert for Failed Refresh */}
      {error && data && (
        <Alert className="border-yellow-200 bg-yellow-50 mb-4 animate-in slide-in-from-top duration-300">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            הרענון נכשל. מציג נתונים מהעדכון האחרון.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <StatsCards stats={data?.stats} />

      {/* Charts Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <WeeklyChart data={data?.weeklyOrders} className="col-span-full lg:col-span-4" />
        <RecentOrders orders={data?.recentOrders} className="col-span-full lg:col-span-3" />
      </div>

      {/* Top Dishes */}
      <TopDishesChart data={data?.topDishes} />
    </>
  );
}
