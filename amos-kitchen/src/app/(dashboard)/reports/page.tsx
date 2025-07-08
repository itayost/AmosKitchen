// src/app/(dashboard)/reports/page.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    FileText,
    ShoppingCart,
    TrendingUp,
    Calendar,
    Download,
    Users,
    DollarSign,
    Package
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

export default function ReportsPage() {
    const currentWeek = format(new Date(), 'dd/MM/yyyy', { locale: he })

    const reports = [
        {
            title: 'סיכום שבועי',
            description: 'סקירה מלאה של ההזמנות, הכנסות ומגמות לשבוע הנוכחי',
            icon: TrendingUp,
            href: '/reports/weekly',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            stats: 'שבוע נוכחי'
        },
        {
            title: 'רשימת קניות',
            description: 'רשימת רכיבים מפורטת לפי קטגוריות וספקים',
            icon: ShoppingCart,
            href: '/reports/shopping-list',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            stats: 'ליום שישי הקרוב'
        },
        {
            title: 'ניתוח לקוחות',
            description: 'דוח מפורט על הרגלי הזמנה ומנות פופולריות לפי לקוח',
            icon: Users,
            href: '/reports/analytics',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            stats: 'זמין בקרוב'
        },
        {
            title: 'דוח הכנסות',
            description: 'ניתוח הכנסות לפי תקופות, מנות וקטגוריות',
            icon: DollarSign,
            href: '/reports/revenue',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            stats: 'זמין בקרוב'
        }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">דוחות</h1>
                <p className="text-muted-foreground">
                    ניתוחים ודוחות לניהול העסק
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>תאריך נוכחי</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-2xl font-bold">{currentWeek}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>דוחות זמינים</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-2xl font-bold">2</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>עדכון אחרון</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-2xl font-bold">עכשיו</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Report Types */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {reports.map((report) => {
                    const Icon = report.icon
                    const isDisabled = report.stats === 'זמין בקרוב'

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
                                    <span className="text-sm text-muted-foreground">
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
                                    <Button asChild className="w-full">
                                        <Link href={report.href}>
                                            צפה בדוח
                                        </Link>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Additional Info */}
            <Card>
                <CardHeader>
                    <CardTitle>על הדוחות</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-medium mb-2">סיכום שבועי</h4>
                        <p className="text-sm text-muted-foreground">
                            מספק תמונה מלאה של פעילות השבוע כולל סטטיסטיקות הזמנות,
                            מנות פופולריות, לקוחות מובילים וחישוב רכיבים נדרשים.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-medium mb-2">רשימת קניות</h4>
                        <p className="text-sm text-muted-foreground">
                            מחשב את כמות הרכיבים הנדרשת לכל ההזמנות השבועיות,
                            מקובץ לפי קטגוריות או ספקים, וכולל התחשבות במלאי קיים.
                        </p>
                    </div>
                    <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            כל הדוחות ניתנים לייצוא ל-Excel או PDF
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
