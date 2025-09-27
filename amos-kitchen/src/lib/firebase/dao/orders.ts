// lib/firebase/dao/orders.ts
import {
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryConstraint,
  writeBatch,
  collection,
  doc,
  runTransaction,
  Timestamp,
  increment
} from 'firebase/firestore'
import {
  ordersCollection,
  orderHistoryCollection,
  getOrderDoc,
  getOrderCounterDoc,
  getServerTimestamp,
  dateToTimestamp,
  timestampToDate,
  getCustomerDoc
} from '../firestore'
import { db } from '../config'
import { getCustomerById } from './customers'
import type { Order, OrderHistory, OrderItem, OrderFilters } from '@/lib/types/firestore'

// Generate order number
export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear()

  return await runTransaction(db, async (transaction) => {
    const counterRef = getOrderCounterDoc(year)
    const counterDoc = await transaction.get(counterRef)

    let nextNumber = 1
    if (counterDoc.exists()) {
      nextNumber = (counterDoc.data().count || 0) + 1
    }

    transaction.set(counterRef, { count: nextNumber, year }, { merge: true })

    return `ORD-${year}-${nextNumber.toString().padStart(4, '0')}`
  })
}

// Create a new order
export async function createOrder(
  data: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  // Generate order number
  const orderNumber = await generateOrderNumber()

  // Get customer data for denormalization
  const customer = await getCustomerById(data.customerId)
  if (!customer) {
    throw new Error('Customer not found')
  }

  const orderData: Order = {
    ...data,
    orderNumber,
    customerData: {
      name: customer.name,
      phone: customer.phone,
      email: customer.email || undefined
    },
    orderDate: data.orderDate instanceof Timestamp ? data.orderDate : dateToTimestamp(data.orderDate as any),
    deliveryDate: data.deliveryDate instanceof Timestamp ? data.deliveryDate : dateToTimestamp(data.deliveryDate as any),
    createdAt: getServerTimestamp(),
    updatedAt: getServerTimestamp()
  }

  const docRef = await addDoc(ordersCollection, orderData)

  // Add initial history entry
  await addOrderHistory(docRef.id, {
    action: 'CREATED',
    details: { message: `הזמנה נוצרה עם ${data.items.length} פריטים` },
    userId: null
  })

  return docRef.id
}

// Get order by ID
export async function getOrderById(id: string): Promise<Order | null> {
  const docRef = getOrderDoc(id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const order = {
    id: docSnap.id,
    ...docSnap.data()
  } as Order

  // Get customer if not denormalized
  if (!order.customerData && order.customerId) {
    const customer = await getCustomerById(order.customerId)
    if (customer) {
      order.customerData = {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || undefined
      }
    }
  }

  return order
}

// Get orders with filters
export async function getOrders(
  filters?: OrderFilters,
  pageSize: number = 10,
  lastDoc?: DocumentSnapshot
): Promise<{ orders: Order[], lastDoc: DocumentSnapshot | null, total: number }> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]

  // Add filters
  if (filters?.status && filters.status !== 'all') {
    constraints.push(where('status', '==', filters.status.toUpperCase()))
  }

  if (filters?.customerId) {
    constraints.push(where('customerId', '==', filters.customerId))
  }

  // Date range filter
  if (filters?.dateRange && filters.dateRange !== 'all') {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (filters.dateRange) {
      case 'today':
        constraints.push(
          where('deliveryDate', '>=', dateToTimestamp(today)),
          where('deliveryDate', '<', dateToTimestamp(new Date(today.getTime() + 24 * 60 * 60 * 1000)))
        )
        break
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        constraints.push(
          where('deliveryDate', '>=', dateToTimestamp(weekAgo)),
          where('deliveryDate', '<=', dateToTimestamp(now))
        )
        break
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        constraints.push(
          where('deliveryDate', '>=', dateToTimestamp(monthAgo)),
          where('deliveryDate', '<=', dateToTimestamp(now))
        )
        break
    }
  }

  // Custom date range
  if (filters?.startDate) {
    constraints.push(where('deliveryDate', '>=', dateToTimestamp(filters.startDate)))
  }
  if (filters?.endDate) {
    constraints.push(where('deliveryDate', '<=', dateToTimestamp(filters.endDate)))
  }

  // Pagination
  constraints.push(limit(pageSize))
  if (lastDoc) {
    constraints.push(startAfter(lastDoc))
  }

  const q = query(ordersCollection, ...constraints)
  const querySnapshot = await getDocs(q)

  const orders: Order[] = []
  for (const doc of querySnapshot.docs) {
    const order = {
      id: doc.id,
      ...doc.data()
    } as Order

    // Client-side search filter
    if (!filters?.search ||
        order.orderNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.customerData?.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.customerData?.phone.includes(filters.search)) {
      orders.push(order)
    }
  }

  // Get total count
  const countSnapshot = await getDocs(query(ordersCollection))
  const total = countSnapshot.size

  return {
    orders,
    lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
    total
  }
}

// Get today's orders
export async function getTodayOrders(): Promise<Order[]> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const q = query(
      ordersCollection,
      where('deliveryDate', '>=', dateToTimestamp(today)),
      where('deliveryDate', '<', dateToTimestamp(tomorrow)),
      orderBy('deliveryDate', 'asc')
    )

    const querySnapshot = await getDocs(q)
    const orders: Order[] = []

    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      } as Order)
    })

    return orders
  } catch (error: any) {
    // Suppress Firebase permission errors during build
    if (error?.code !== 'permission-denied') {
      console.error('Error in getTodayOrders:', error)
    }
    return []
  }
}

// Update order
export async function updateOrder(
  id: string,
  data: Partial<Order>,
  userId?: string
): Promise<void> {
  const docRef = getOrderDoc(id)

  const updateData: any = {
    ...data,
    updatedAt: getServerTimestamp()
  }

  // Convert dates to timestamps if needed
  if (updateData.deliveryDate && !(updateData.deliveryDate instanceof Timestamp)) {
    updateData.deliveryDate = dateToTimestamp(updateData.deliveryDate)
  }
  if (updateData.orderDate && !(updateData.orderDate instanceof Timestamp)) {
    updateData.orderDate = dateToTimestamp(updateData.orderDate)
  }

  // Remove id if present
  delete updateData.id

  await updateDoc(docRef, updateData)

  // Add history entry
  if (data.status) {
    await addOrderHistory(id, {
      action: 'STATUS_CHANGE',
      details: { newStatus: data.status },
      userId
    })
  }
}

// Update order status
export async function updateOrderStatus(
  id: string,
  status: Order['status'],
  userId?: string
): Promise<void> {
  await updateOrder(id, { status }, userId)
}

// Delete order
export async function deleteOrder(id: string): Promise<void> {
  // Delete history entries first
  const historySnapshot = await getDocs(orderHistoryCollection(id))
  const batch = writeBatch(db)

  historySnapshot.forEach((doc) => {
    batch.delete(doc.ref)
  })

  await batch.commit()

  // Delete order
  const docRef = getOrderDoc(id)
  await deleteDoc(docRef)
}

// Add order history entry
export async function addOrderHistory(
  orderId: string,
  data: Omit<OrderHistory, 'id' | 'orderId' | 'createdAt'>
): Promise<void> {
  const historyData: OrderHistory = {
    ...data,
    orderId,
    createdAt: getServerTimestamp()
  }

  await addDoc(orderHistoryCollection(orderId), historyData)
}

// Get order history
export async function getOrderHistory(orderId: string): Promise<OrderHistory[]> {
  const q = query(orderHistoryCollection(orderId), orderBy('createdAt', 'desc'))
  const querySnapshot = await getDocs(q)

  const history: OrderHistory[] = []
  querySnapshot.forEach((doc) => {
    history.push({
      id: doc.id,
      ...doc.data()
    } as OrderHistory)
  })

  return history
}

// Get orders by customer
export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  const q = query(
    ordersCollection,
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  )

  const querySnapshot = await getDocs(q)
  const orders: Order[] = []

  querySnapshot.forEach((doc) => {
    orders.push({
      id: doc.id,
      ...doc.data()
    } as Order)
  })

  return orders
}

// Get order statistics
export async function getOrderStats(startDate?: Date, endDate?: Date): Promise<{
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  statusCounts: Record<string, number>
}> {
  let q = query(ordersCollection)

  if (startDate) {
    q = query(q, where('createdAt', '>=', dateToTimestamp(startDate)))
  }
  if (endDate) {
    q = query(q, where('createdAt', '<=', dateToTimestamp(endDate)))
  }

  const querySnapshot = await getDocs(q)

  let totalRevenue = 0
  const statusCounts: Record<string, number> = {}

  querySnapshot.forEach((doc) => {
    const order = doc.data() as Order
    totalRevenue += order.totalAmount
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
  })

  const totalOrders = querySnapshot.size

  return {
    totalOrders,
    totalRevenue,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    statusCounts
  }
}