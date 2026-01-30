// src/app/(dashboard)/reports/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AnimatedStatCard } from '@/components/reports/animated-stat-card'
import {
    FileText,
    TrendingUp,
    Download,
    Users,
    DollarSign,
    Package,
    BarChart3,
    Clock,
    AlertCircle,
    RefreshCw,
    ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { fetchWithAuth } from '@/lib/api/fetch-with-auth'

interface ReportStats {
    weeklyOrders: number
    monthlyRevenue: number
    activeCustomers: number
    lastReportDate: string
}

export default function ReportsPage() {
    const [stats, setStats] = useState<ReportStats>({
        weeklyOrders: 0,
        monthlyRevenue: 0,
        activeCustomers: 0,
        lastReportDate: new Date().toISOString()
    })
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        fetchReportStats()
    }, [])

    const fetchReportStats = async () => {
        try {
            setLoading(true)
            const response = await fetchWithAuth('/api/dashboard')
            if (response.ok) {
                const data = await response.json()
                setStats({
                    weeklyOrders: data.week?.orders || 0,
                    monthlyRevenue: data.week?.revenue || 0,
                    activeCustomers: data.customers?.active || 0,
                    lastReportDate: new Date().toISOString()
                })
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchReportStats()
        setRefreshing(false)
    }

    const reports = [
        {
            title: 'סיכום שבועי',
            description: 'סקירה מלאה של ההזמנות, הכנסות ומגמות לשבוע הנוכחי',
            icon: TrendingUp,
            href: '/reports/weekly',
            gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
            stats: `${stats.weeklyOrders} הזמנות`,
            available: true
        },
        {
            title: 'ניתוח לקוחות',
            description: 'דוח מפורט על הרגלי הזמנה, לקוחות מובילים ומנות פופולריות',
            icon: Users,
            href: '/reports/analytics',
            gradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
            iconBg: 'bg-purple-100 dark:bg-purple-900/30',
            iconColor: 'text-purple-600 dark:text-purple-400',
            stats: `${stats.activeCustomers} לקוחות`,
            available: true
        },
        {
            title: 'דוח הכנסות',
            description: 'ניתוח הכנסות לפי תקופות, השוואות ומגמות עסקיות',
            icon: DollarSign,
            href: '/reports/revenue',
            gradient: 'from-green-500/10 via-green-500/5 to-transparent',
            iconBg: 'bg-green-100 dark:bg-green-900/30',
            iconColor: 'text-green-600 dark:text-green-400',
            stats: `₪${stats.monthlyRevenue.toLocaleString()}`,
            available: false
        },
        {
            title: 'דוח מלאי',
            description: 'מעקב אחר מלאי, צריכה והתראות על חוסרים',
            icon: Package,
            href: '/reports/inventory',
            gradient: 'from-orange-500/10 via-orange-500/5 to-transparent',
            iconBg: 'bg-orange-100 dark:bg-orange-900/30',
            iconColor: 'text-orange-600 dark:text-orange-400',
            stats: 'בקרוב',
            available: false
        }
    ]

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-16 bg-muted rounded-lg" />
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-28 bg-muted rounded-lg" />
                    ))}
                </div>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-48 bg-muted rounded-lg" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-l from-primary to-primary/60 bg-clip-text text-transparent">
                        דוחות וניתוחים
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        כלים לניתוח ביצועים וקבלת החלטות מבוססות נתונים
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    רענן נתונים
                </Button>
            </div>

            {/* Quick Stats with Animated Cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <AnimatedStatCard
                    title="הזמנות השבוע"
                    value={stats.weeklyOrders}
                    icon={TrendingUp}
                    gradient="blue"
                    change={12}
                    changeLabel="מהשבוע שעבר"
                />
                <AnimatedStatCard
                    title="הכנסות החודש"
                    value={stats.monthlyRevenue}
                    prefix="₪"
                    icon={DollarSign}
                    gradient="green"
                    change={8}
                    changeLabel="מהחודש שעבר"
                />
                <AnimatedStatCard
                    title="לקוחות פעילים"
                    value={stats.activeCustomers}
                    icon={Users}
                    gradient="purple"
                    change={5}
                    changeLabel="חדשים השבוע"
                />
            </div>

            {/* Report Types */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {reports.map((report) => {
                    const Icon = report.icon
                    const isDisabled = !report.available

                    return (
                        <Card
                            key={report.href}
                            className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${isDisabled ? 'opacity-60' : ''}`}
                        >
                            {/* Gradient background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${report.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                            <CardHeader className="relative">
                                <div className="flex items-start justify-between">
                                    <div className={`p-3 rounded-xl ${report.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                                        <Icon className={`h-6 w-6 ${report.iconColor}`} />
                                    </div>
                                    <span className="text-sm font-semibold text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                                        {report.stats}
                                    </span>
                                </div>
                                <CardTitle className="mt-4 text-xl">{report.title}</CardTitle>
                                <CardDescription className="text-sm">{report.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="relative">
                                {isDisabled ? (
                                    <Button variant="outline" disabled className="w-full">
                                        <Clock className="h-4 w-4 ml-2" />
                                        זמין בקרוב
                                    </Button>
                                ) : (
                                    <Link href={report.href} className="block">
                                        <Button className="w-full group/btn">
                                            <FileText className="h-4 w-4 ml-2" />
                                            צפה בדוח
                                            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover/btn:-translate-x-1" />
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Features Info */}
            <Card className="bg-gradient-to-br from-muted/50 to-muted/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        יכולות הדוחות
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                                <BarChart3 className="h-5 w-5 text-blue-500" />
                                <h4 className="font-semibold">סיכום שבועי</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                מספק תמונה מלאה של פעילות השבוע: הזמנות, הכנסות,
                                מנות פופולריות ולקוחות מובילים.
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="h-5 w-5 text-purple-500" />
                                <h4 className="font-semibold">ניתוח לקוחות</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                מעקב אחר הרגלי הזמנה, זיהוי לקוחות חוזרים,
                                ומנות מועדפות לכל לקוח.
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="h-5 w-5 text-green-500" />
                                <h4 className="font-semibold">דוח הכנסות</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                ניתוח הכנסות לפי תקופות, השוואה לתקופות קודמות
                                וזיהוי מגמות עסקיות.
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                                <Package className="h-5 w-5 text-orange-500" />
                                <h4 className="font-semibold">ניהול מלאי</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                מעקב אחר רמות מלאי, התראות על חוסרים
                                וניתוח צריכה לתכנון רכש.
                            </p>
                        </div>
                    </div>
                    <div className="pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
                        <Download className="h-4 w-4" />
                        כל הדוחות ניתנים לייצוא ל-Excel או PDF להדפסה ושיתוף
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
