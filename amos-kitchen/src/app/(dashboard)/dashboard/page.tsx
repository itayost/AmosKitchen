// app/(dashboard)/dashboard/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ShoppingCart,
    Users,
    DollarSign,
    Package,
    ArrowUp,
    ArrowDown
} from "lucide-react";

export default function DashboardPage() {
    // This would be fetched from your API
    const stats = {
        totalOrders: 42,
        totalCustomers: 28,
        weeklyRevenue: 3250,
        pendingOrders: 8,
        ordersChange: 12,
        customersChange: -5,
        revenueChange: 18,
        pendingChange: 3,
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">לוח בקרה</h2>
                <p className="text-muted-foreground">
                    סקירה כללית של המערכת
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            הזמנות השבוע
                        </CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.ordersChange > 0 ? (
                                <span className="flex items-center text-green-600">
                                    <ArrowUp className="h-3 w-3 ml-1" />
                                    {stats.ordersChange}% מהשבוע שעבר
                                </span>
                            ) : (
                                <span className="flex items-center text-red-600">
                                    <ArrowDown className="h-3 w-3 ml-1" />
                                    {Math.abs(stats.ordersChange)}% מהשבוע שעבר
                                </span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            לקוחות פעילים
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.customersChange > 0 ? (
                                <span className="flex items-center text-green-600">
                                    <ArrowUp className="h-3 w-3 ml-1" />
                                    {stats.customersChange}% מהשבוע שעבר
                                </span>
                            ) : (
                                <span className="flex items-center text-red-600">
                                    <ArrowDown className="h-3 w-3 ml-1" />
                                    {Math.abs(stats.customersChange)}% מהשבוע שעבר
                                </span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            הכנסות השבוע
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₪{stats.weeklyRevenue}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.revenueChange > 0 ? (
                                <span className="flex items-center text-green-600">
                                    <ArrowUp className="h-3 w-3 ml-1" />
                                    {stats.revenueChange}% מהשבוע שעבר
                                </span>
                            ) : (
                                <span className="flex items-center text-red-600">
                                    <ArrowDown className="h-3 w-3 ml-1" />
                                    {Math.abs(stats.revenueChange)}% מהשבוע שעבר
                                </span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            הזמנות ממתינות
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.pendingChange > 0 ? (
                                <span className="flex items-center text-orange-600">
                                    <ArrowUp className="h-3 w-3 ml-1" />
                                    {stats.pendingChange} יותר מאתמול
                                </span>
                            ) : (
                                <span className="flex items-center text-green-600">
                                    <ArrowDown className="h-3 w-3 ml-1" />
                                    {Math.abs(stats.pendingChange)} פחות מאתמול
                                </span>
                            )}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
