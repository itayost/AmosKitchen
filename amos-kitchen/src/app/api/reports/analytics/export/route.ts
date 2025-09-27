// src/app/api/reports/analytics/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const period = searchParams.get('period') || 'month'
        
        // Fetch analytics data from the main analytics endpoint
        const baseUrl = request.nextUrl.origin
        const analyticsResponse = await fetch(`${baseUrl}/api/reports/analytics?period=${period}`)
        
        if (!analyticsResponse.ok) {
            throw new Error('Failed to fetch analytics data')
        }
        
        const data = await analyticsResponse.json()
        
        // Create workbook
        const wb = XLSX.utils.book_new()
        
        // Summary sheet
        const summaryData = [
            ['סיכום כללי'],
            [''],
            ['מדד', 'ערך'],
            ['סה״כ הכנסות', data.summary.totalRevenue],
            ['מספר הזמנות', data.summary.totalOrders],
            ['ערך הזמנה ממוצע', data.summary.averageOrderValue],
            ['לקוחות פעילים', data.summary.totalCustomers],
            ['לקוחות חדשים', data.summary.newCustomers],
            ['לקוחות חוזרים', data.summary.returningCustomers],
            ['גידול בהכנסות %', data.summary.revenueGrowth],
            ['גידול בהזמנות %', data.summary.ordersGrowth]
        ]
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
        XLSX.utils.book_append_sheet(wb, summarySheet, 'סיכום')
        
        // Revenue sheet
        const revenueData = [
            ['הכנסות יומיות'],
            ['תאריך', 'סכום'],
            ...data.revenue.daily.map((item: any) => [item.date, item.amount])
        ]
        const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData)
        XLSX.utils.book_append_sheet(wb, revenueSheet, 'הכנסות')
        
        // Top dishes sheet
        const dishesData = [
            ['מנות פופולריות'],
            ['מנה', 'כמות', 'הכנסות'],
            ...data.dishes.topSelling.map((dish: any) => [
                dish.name,
                dish.quantity,
                dish.revenue
            ])
        ]
        const dishesSheet = XLSX.utils.aoa_to_sheet(dishesData)
        XLSX.utils.book_append_sheet(wb, dishesSheet, 'מנות')
        
        // Customers sheet
        const customersData = [
            ['לקוחות מובילים'],
            ['שם', 'סה״כ הוצאות', 'מספר הזמנות'],
            ...data.customers.topSpenders.map((customer: any) => [
                customer.name,
                customer.totalSpent,
                customer.orderCount
            ])
        ]
        const customersSheet = XLSX.utils.aoa_to_sheet(customersData)
        XLSX.utils.book_append_sheet(wb, customersSheet, 'לקוחות')
        
        // Category breakdown sheet
        const categoryData = [
            ['פילוח לפי קטגוריה'],
            ['קטגוריה', 'כמות', 'הכנסות'],
            ...Object.entries(data.dishes.byCategory).map(([category, stats]: [string, any]) => [
                translateCategory(category),
                stats.quantity,
                stats.revenue
            ])
        ]
        const categorySheet = XLSX.utils.aoa_to_sheet(categoryData)
        XLSX.utils.book_append_sheet(wb, categorySheet, 'קטגוריות')
        
        // Generate buffer
        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
        
        // Return as downloadable file
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=analytics-${period}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
            }
        })
    } catch (error) {
        console.error('Error exporting analytics:', error)
        return NextResponse.json(
            { error: 'Failed to export analytics' },
            { status: 500 }
        )
    }
}

function translateCategory(category: string): string {
    const categories: Record<string, string> = {
        'appetizer': 'מנה ראשונה',
        'main': 'מנה עיקרית',
        'side': 'תוספת',
        'dessert': 'קינוח',
        'beverage': 'משקה',
        'vegetables': 'ירקות',
        'meat': 'בשר',
        'dairy': 'חלב',
        'grains': 'דגנים',
        'spices': 'תבלינים',
        'other': 'אחר'
    }
    return categories[category.toLowerCase()] || category
}
