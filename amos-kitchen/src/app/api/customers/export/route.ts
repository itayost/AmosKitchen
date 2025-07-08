// app/api/customers/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        // Fetch all customers with order statistics
        const customers = await prisma.customer.findMany({
            include: {
                orders: {
                    select: {
                        id: true,
                        totalAmount: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Transform data for CSV
        const csvData = customers.map(customer => {
            const orderCount = customer.orders.length
            const totalSpent = customer.orders.reduce(
                (sum, order) => sum + Number(order.totalAmount), 
                0
            )
            const lastOrderDate = customer.orders.length > 0
                ? customer.orders.reduce((latest, order) => 
                    order.createdAt > latest ? order.createdAt : latest, 
                    customer.orders[0].createdAt
                )
                : null

            return {
                name: customer.name,
                phone: customer.phone,
                email: customer.email || '',
                address: customer.address || '',
                notes: customer.notes || '',
                orderCount,
                totalSpent: totalSpent.toFixed(2),
                lastOrderDate: lastOrderDate ? new Date(lastOrderDate).toLocaleDateString('he-IL') : '',
                createdAt: new Date(customer.createdAt).toLocaleDateString('he-IL')
            }
        })

        // Create CSV header
        const headers = [
            'שם',
            'טלפון',
            'אימייל',
            'כתובת',
            'הערות',
            'מספר הזמנות',
            'סכום כולל',
            'הזמנה אחרונה',
            'תאריך הצטרפות'
        ]

        // Create CSV content with BOM for Hebrew support
        const BOM = '\uFEFF'
        const csvContent = BOM + [
            headers.join(','),
            ...csvData.map(row => 
                [
                    `"${row.name}"`,
                    `"${row.phone}"`,
                    `"${row.email}"`,
                    `"${row.address}"`,
                    `"${row.notes}"`,
                    row.orderCount,
                    row.totalSpent,
                    row.lastOrderDate,
                    row.createdAt
                ].join(',')
            )
        ].join('\n')

        // Return CSV response
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="customers-${new Date().toISOString().split('T')[0]}.csv"`
            }
        })
    } catch (error) {
        console.error('Error exporting customers:', error)
        return NextResponse.json(
            { error: 'Failed to export customers' },
            { status: 500 }
        )
    }
}
