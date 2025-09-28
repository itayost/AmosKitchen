// lib/hooks/use-dashboard-data.ts
import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/api/fetch-with-auth';

interface DashboardData {
  stats: {
    totalOrders: number;
    activeCustomers: number;
    revenue: number;
    avgOrderValue: number;
  };
  weeklyOrders: Array<{ day: string; orders: number }>;
  topDishes: Array<{ name: string; count: number }>;
  recentOrders: Array<{
    id: string;
    customer: string;
    amount: number;
    status: string;
    time: string;
  }>;
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (showRefreshAnimation = false) => {
    try {
      if (showRefreshAnimation) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetchWithAuth('/api/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const refresh = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  return { data, isLoading, error, isRefreshing, refresh };
}
