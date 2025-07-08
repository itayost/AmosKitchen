// src/components/dashboard/dashboard-skeleton.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <>
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-9 w-[80px]" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-[60px] mb-1" />
              <Skeleton className="h-3 w-[140px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7 mb-4">
        {/* Weekly Chart Skeleton */}
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <Skeleton className="h-5 w-[150px]" />
          </CardHeader>
          <CardContent>
            <div className="h-[350px] flex items-end justify-around gap-2">
              {[...Array(7)].map((_, i) => (
                <Skeleton 
                  key={i} 
                  className="flex-1" 
                  style={{ height: `${Math.random() * 60 + 40}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders Skeleton */}
        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-5 w-[120px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-[120px] mb-1" />
                      <Skeleton className="h-3 w-[80px]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-[50px]" />
                    <Skeleton className="h-6 w-[60px] rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Dishes Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[200px]" />
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-end justify-around gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton 
                key={i} 
                className="flex-1" 
                style={{ height: `${Math.random() * 70 + 30}%` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
