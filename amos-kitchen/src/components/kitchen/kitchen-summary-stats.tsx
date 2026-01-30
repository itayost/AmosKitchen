// components/kitchen/kitchen-summary-stats.tsx
'use client'

import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ClipboardList,
  Utensils,
  DollarSign,
  Clock,
  AlertTriangle,
  FileText,
  Truck,
  Receipt
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { DishChecklistPrint, DeliveryRoutePrint, OrderReceiptsPrint } from './print-views'
import type { KitchenOrder, KitchenStats } from '@/lib/types/kitchen'

interface KitchenSummaryStatsProps {
  orders: KitchenOrder[]
  stats: KitchenStats
  fridayDate: Date
}

export function KitchenSummaryStats({
  orders,
  stats,
  fridayDate
}: KitchenSummaryStatsProps) {
  // Print refs
  const dishChecklistRef = useRef<HTMLDivElement>(null)
  const deliveryRouteRef = useRef<HTMLDivElement>(null)
  const orderReceiptsRef = useRef<HTMLDivElement>(null)

  // Print handlers
  const handlePrintDishes = useReactToPrint({
    contentRef: dishChecklistRef,
    documentTitle: `רשימת_מנות_${format(fridayDate, 'dd-MM-yyyy')}`,
  })

  const handlePrintRoute = useReactToPrint({
    contentRef: deliveryRouteRef,
    documentTitle: `משלוחים_${format(fridayDate, 'dd-MM-yyyy')}`,
  })

  const handlePrintReceipts = useReactToPrint({
    contentRef: orderReceiptsRef,
    documentTitle: `קבלות_${format(fridayDate, 'dd-MM-yyyy')}`,
  })

  // Calculate progress
  const readyCount = stats.byStatus.READY || 0
  const totalActive = stats.totalOrders
  const progressPercent = totalActive > 0 ? Math.round((readyCount / totalActive) * 100) : 0

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Total Orders */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">הזמנות פעילות</p>
                <p className="text-3xl font-bold">{stats.totalOrders}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Dishes */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">מנות להכנה</p>
                <p className="text-3xl font-bold">{stats.totalDishes}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Utensils className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">הכנסות</p>
                <p className="text-3xl font-bold">₪{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cutoff Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">סטטוס הזמנות</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={
                      stats.cutoffStatus === 'closed' ? 'destructive' :
                      stats.cutoffStatus === 'warning' ? 'secondary' : 'default'
                    }
                  >
                    {stats.cutoffStatus === 'closed' && 'סגור'}
                    {stats.cutoffStatus === 'warning' && `נסגר בעוד ${stats.timeUntilCutoff} דק'`}
                    {stats.cutoffStatus === 'open' && 'פתוח'}
                  </Badge>
                </div>
              </div>
              <div className={cn(
                "p-3 rounded-full",
                stats.cutoffStatus === 'closed' ? 'bg-red-100' :
                stats.cutoffStatus === 'warning' ? 'bg-yellow-100' : 'bg-green-100'
              )}>
                <Clock className={cn(
                  "h-6 w-6",
                  stats.cutoffStatus === 'closed' ? 'text-red-600' :
                  stats.cutoffStatus === 'warning' ? 'text-yellow-600' : 'text-green-600'
                )} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critical Preferences */}
        {stats.criticalPreferenceCount > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">התראות קריטיות</p>
                  <p className="text-3xl font-bold text-red-700">{stats.criticalPreferenceCount}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full animate-pulse">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Progress Bar */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">התקדמות הכנה</span>
            <span className="text-sm text-muted-foreground">
              {readyCount} מתוך {totalActive} הזמנות מוכנות ({progressPercent}%)
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Print Actions */}
      <div className="flex flex-wrap gap-2 mt-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrintDishes()}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                הדפס רשימת מנות
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>הדפסת כל המנות לפי קטגוריה</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrintRoute()}
                className="gap-2"
              >
                <Truck className="h-4 w-4" />
                הדפס מסלול משלוחים
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>רשימת הזמנות מוכנות לפי כתובת</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrintReceipts()}
                className="gap-2"
              >
                <Receipt className="h-4 w-4" />
                הדפס קבלות
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>קבלה לכל הזמנה</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Hidden Print Components - positioned off-screen for react-to-print */}
      <div className="fixed -left-[9999px] -top-[9999px] print:hidden">
        <DishChecklistPrint
          ref={dishChecklistRef}
          orders={orders}
          fridayDate={fridayDate}
        />
        <DeliveryRoutePrint
          ref={deliveryRouteRef}
          orders={orders}
          fridayDate={fridayDate}
        />
        <OrderReceiptsPrint
          ref={orderReceiptsRef}
          orders={orders}
          fridayDate={fridayDate}
        />
      </div>
    </>
  )
}
