'use client';

// components/dashboard/top-dishes-chart.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TopDishesChartProps {
  data?: Array<{ name: string; count: number }>;
}

export function TopDishesChart({ data }: TopDishesChartProps) {
  return (
    <Card className="transition-all duration-300">
      <CardHeader>
        <CardTitle>המנות הפופולריות השבוע</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data || []}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number) => [`${value} הזמנות`, 'כמות']}
            />
            <Bar 
              dataKey="count" 
              fill="hsl(var(--primary))"
              animationDuration={1000}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
