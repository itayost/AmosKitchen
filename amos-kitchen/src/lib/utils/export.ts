// lib/utils/export.ts
import * as XLSX from 'xlsx'
import { format } from 'date-fns'

interface ExportOrder {
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string
  deliveryDate: string
  deliveryAddress: string
  totalAmount: number
  status: string
  itemsCount: number
  items: {
    dishName: string
    quantity: number
    price: number
    total: number
    notes: string
  }[]
  notes: string
  createdAt: string
  updatedAt: string
}

const statusLabels: Record<string, string> = {
  new: 'חדש',
  confirmed: 'אושר',
  preparing: 'בהכנה',
  ready: 'מוכן',
  delivered: 'נמסר',
  cancelled: 'בוטל'
}

export function exportOrdersToExcel(orders: ExportOrder[]) {
  // Create main orders sheet data
  const ordersData = orders.map(order => ({
    'מספר הזמנה': order.orderNumber,
    'שם לקוח': order.customerName,
    'טלפון': order.customerPhone,
    'אימייל': order.customerEmail,
    'תאריך משלוח': order.deliveryDate,
    'כתובת משלוח': order.deliveryAddress,
    'סכום כולל': `₪${order.totalAmount}`,
    'סטטוס': statusLabels[order.status] || order.status,
    'מספר פריטים': order.itemsCount,
    'הערות': order.notes,
    'תאריך יצירה': order.createdAt,
    'עדכון אחרון': order.updatedAt
  }))

  // Create order items sheet data
  const itemsData: any[] = []
  orders.forEach(order => {
    order.items.forEach(item => {
      itemsData.push({
        'מספר הזמנה': order.orderNumber,
        'שם לקוח': order.customerName,
        'שם מנה': item.dishName,
        'כמות': item.quantity,
        'מחיר ליחידה': `₪${item.price}`,
        'סה"כ': `₪${item.total}`,
        'הערות': item.notes
      })
    })
  })

  // Create workbook
  const wb = XLSX.utils.book_new()

  // Add orders sheet
  const ordersWs = XLSX.utils.json_to_sheet(ordersData)
  XLSX.utils.book_append_sheet(wb, ordersWs, 'הזמנות')

  // Add items sheet
  if (itemsData.length > 0) {
    const itemsWs = XLSX.utils.json_to_sheet(itemsData)
    XLSX.utils.book_append_sheet(wb, itemsWs, 'פריטי הזמנות')
  }

  // Create summary sheet
  const summaryData = [
    { 'סיכום': 'סה"כ הזמנות', 'ערך': orders.length },
    { 'סיכום': 'סה"כ הכנסות', 'ערך': `₪${orders.reduce((sum, order) => sum + order.totalAmount, 0)}` },
    { 'סיכום': 'ממוצע להזמנה', 'ערך': `₪${Math.round(orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length || 0)}` },
    { 'סיכום': '', 'ערך': '' },
    { 'סיכום': 'הזמנות לפי סטטוס:', 'ערך': '' },
    ...Object.entries(statusLabels).map(([status, label]) => ({
      'סיכום': label,
      'ערך': orders.filter(order => order.status === status).length
    }))
  ]
  
  const summaryWs = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, summaryWs, 'סיכום')

  // Generate filename with current date
  const filename = `orders_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`

  // Write file
  XLSX.writeFile(wb, filename)
}

// Export single order to PDF format (data structure)
export function prepareOrderForPrint(order: ExportOrder) {
  return {
    header: {
      title: 'הזמנה',
      orderNumber: order.orderNumber,
      date: order.createdAt
    },
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail,
      address: order.deliveryAddress
    },
    delivery: {
      date: order.deliveryDate,
      status: statusLabels[order.status] || order.status
    },
    items: order.items,
    summary: {
      subtotal: order.totalAmount,
      total: order.totalAmount
    },
    notes: order.notes
  }
}
