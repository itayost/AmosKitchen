// src/app/(dashboard)/reports/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    FileText,
    TrendingUp,
    Calendar,
    Download,
    Users,
    DollarSign,
    Package,
    BarChart3,
    Clock,
    AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
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

    const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: he })
    const currentMonth = format(new Date(), 'MMMM yyyy', { locale: he })

    const reports = [
        {
            title: 'סיכום שבועי',
            description: 'סקירה מלאה של ההזמנות, הכנסות ומגמות לשבוע הנוכחי',
            icon: TrendingUp,
            href: '/reports/weekly',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            stats: `${stats.weeklyOrders} הזמנות השבוע`,
            available: true
        },
        {
            title: 'ניתוח לקוחות',
            description: 'דוח מפורט על הרגלי הזמנה, לקוחות מובילים ומנות פופולריות',
            icon: Users,
            href: '/reports/analytics',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            stats: `${stats.activeCustomers} לקוחות פעילים`,
            available: true
        },
        {
            title: 'דוח הכנסות',
            description: 'ניתוח הכנסות לפי תקופות, השוואות ומגמות עסקיות',
            icon: DollarSign,
            href: '/reports/revenue',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            stats: `₪${stats.monthlyRevenue.toLocaleString()} החודש`,
            available: false // Will implement later
        },
        {
            title: 'דוח מלאי',
            description: 'מעקב אחר מלאי, צריכה והתראות על חוסרים',
            icon: Package,
            href: '/reports/inventory',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            stats: 'זמין בקרוב',
            available: false
        }
    ]

    const quickStats = [
        {
            title: 'תאריך נוכחי',
            value: currentDate,
            icon: Calendar,
            color: 'text-blue-600'
        },
        {
            title: 'חודש נוכחי',
            value: currentMonth,
            icon: BarChart3,
            color: 'text-purple-600'
        },
        {
            title: 'עדכון אחרון',
            value: format(new Date(), 'HH:mm', { locale: he }),
            icon: Clock,
            color: 'text-green-600'
        }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">דוחות וניתוחים</h1>
                    <p className="text-muted-foreground">
                        כלים לניתוח ביצועים וקבלת החלטות מבוססות נתונים
                    </p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    <Clock className="h-4 w-4 ml-2" />
                    רענן נתונים
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                {quickStats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <Card key={index}>
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2">
                                    <Icon className={`h-4 w-4 ${stat.color}`} />
                                    {stat.title}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Report Types */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {reports.map((report) => {
                    const Icon = report.icon
                    const isDisabled = !report.available

                    return (
                        <Card
                            key={report.href}
                            className={`hover:shadow-lg transition-shadow ${isDisabled ? 'opacity-60' : ''}`}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className={`p-3 rounded-lg ${report.bgColor}`}>
                                        <Icon className={`h-6 w-6 ${report.color}`} />
                                    </div>
                                    <span className="text-sm text-muted-foreground font-medium">
                                        {report.stats}
                                    </span>
                                </div>
                                <CardTitle className="mt-4">{report.title}</CardTitle>
                                <CardDescription>{report.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isDisabled ? (
                                    <Button variant="outline" disabled className="w-full">
                                        זמין בקרוב
                                    </Button>
                                ) : (
                                    <Link href={report.href} className="block">
                                        <Button className="w-full">
                                            <FileText className="h-4 w-4 ml-2" />
                                            צפה בדוח
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Features Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        יכולות הדוחות
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <h4 className="font-medium mb-2">📊 סיכום שבועי</h4>
                            <p className="text-sm text-muted-foreground">
                                מספק תמונה מלאה של פעילות השבוע: הזמנות, הכנסות,
                                מנות פופולריות ולקוחות מובילים.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">👥 ניתוח לקוחות</h4>
                            <p className="text-sm text-muted-foreground">
                                מעקב אחר הרגלי הזמנה, זיהוי לקוחות חוזרים,
                                ומנות מועדפות לכל לקוח.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">💰 דוח הכנסות</h4>
                            <p className="text-sm text-muted-foreground">
                                ניתוח הכנסות לפי תקופות, השוואה לתקופות קודמות
                                וזיהוי מגמות עסקיות.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">📦 ניהול מלאי</h4>
                            <p className="text-sm text-muted-foreground">
                                מעקב אחר רמות מלאי, התראות על חוסרים
                                וניתוח צריכה לתכנון רכש.
                            </p>
                        </div>
                    </div>
                    <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            כל הדוחות ניתנים לייצוא ל-Excel או PDF להדפסה ושיתוף
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}