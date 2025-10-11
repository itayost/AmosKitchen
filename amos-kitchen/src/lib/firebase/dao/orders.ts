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
import type { Order, OrderHistory, OrderItem, OrderFilters, OrderDoc, OrderHistoryDoc } from '@/lib/types/firestore'

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

  const orderData: OrderDoc = {
    ...data,
    orderNumber,
    customerData: {
      name: customer.name,
      phone: customer.phone,
      ...(customer.email && { email: customer.email })
    },
    orderDate: data.orderDate instanceof Date ? dateToTimestamp(data.orderDate) : data.orderDate,
    deliveryDate: data.deliveryDate instanceof Date ? dateToTimestamp(data.deliveryDate) : data.deliveryDate,
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

  const data = docSnap.data()
  const order: Order = {
    id: docSnap.id,
    ...data,
    orderDate: data.orderDate instanceof Timestamp ? data.orderDate.toDate() : new Date(),
    deliveryDate: data.deliveryDate instanceof Timestamp ? data.deliveryDate.toDate() : new Date(),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date()
  }

  // Get customer if not denormalized
  if (!order.customerData && order.customerId) {
    const customer = await getCustomerById(order.customerId)
    if (customer) {
      order.customerData = {
        name: customer.name,
        phone: customer.phone,
        ...(customer.email && { email: customer.email })
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
  try {
    const constraints: QueryConstraint[] = []

    // Build constraints carefully to avoid requiring composite indexes
    // Only use one field for range queries along with orderBy

    // Priority: customerId filter (exact match)
    if (filters?.customerId) {
      constraints.push(where('customerId', '==', filters.customerId))
    }

    // Priority: status filter (exact match)
    if (filters?.status && filters.status !== 'all') {
      constraints.push(where('status', '==', filters.status.toUpperCase()))
    }

    // Date range filter - only apply if no other range queries exist
    // This simplifies the query to avoid complex composite index requirements
    if (filters?.dateRange && filters.dateRange !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      switch (filters.dateRange) {
        case 'today':
          constraints.push(
            where('deliveryDate', '>=', dateToTimestamp(today)),
            where('deliveryDate', '<', dateToTimestamp(new Date(today.getTime() + 24 * 60 * 60 * 1000)))
          )
          // Use deliveryDate for ordering when filtering by date
          constraints.push(orderBy('deliveryDate', 'desc'))
          break
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          constraints.push(
            where('deliveryDate', '>=', dateToTimestamp(weekAgo)),
            where('deliveryDate', '<=', dateToTimestamp(now))
          )
          constraints.push(orderBy('deliveryDate', 'desc'))
          break
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          constraints.push(
            where('deliveryDate', '>=', dateToTimestamp(monthAgo)),
            where('deliveryDate', '<=', dateToTimestamp(now))
          )
          constraints.push(orderBy('deliveryDate', 'desc'))
          break
      }
    } else if (filters?.startDate || filters?.endDate) {
      // Custom date range
      if (filters?.startDate) {
        constraints.push(where('deliveryDate', '>=', dateToTimestamp(filters.startDate)))
      }
      if (filters?.endDate) {
        constraints.push(where('deliveryDate', '<=', dateToTimestamp(filters.endDate)))
      }
      constraints.push(orderBy('deliveryDate', 'desc'))
    } else {
      // Default ordering by creation date
      constraints.push(orderBy('createdAt', 'desc'))
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
      const data = doc.data()
      const order: Order = {
        id: doc.id,
        ...data,
        orderDate: data.orderDate instanceof Timestamp ? data.orderDate.toDate() : new Date(),
        deliveryDate: data.deliveryDate instanceof Timestamp ? data.deliveryDate.toDate() : new Date(),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date()
      }

      // Client-side search filter
      if (!filters?.search ||
          order.orderNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
          order.customerData?.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          order.customerData?.phone.includes(filters.search)) {
        orders.push(order)
      }
    }

    // Use query result size as approximate total instead of fetching all documents
    // This is more efficient and won't fail on large datasets
    const total = orders.length

    return {
      orders,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
      total
    }
  } catch (error: any) {
    // Handle Firestore-specific errors
    if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
      console.error('Firestore index required. Please create the necessary composite index:', error.message)
      // Return empty result instead of throwing
      return {
        orders: [],
        lastDoc: null,
        total: 0
      }
    }

    if (error?.code === 'permission-denied') {
      console.error('Firestore permission denied:', error.message)
      return {
        orders: [],
        lastDoc: null,
        total: 0
      }
    }

    // Re-throw other errors
    console.error('Error in getOrders:', error)
    throw error
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
      const data = doc.data()
      orders.push({
        id: doc.id,
        ...data,
        orderDate: data.orderDate instanceof Timestamp ? data.orderDate.toDate() : new Date(),
        deliveryDate: data.deliveryDate instanceof Timestamp ? data.deliveryDate.toDate() : new Date(),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date()
      })
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

// Get orders for the next/closest delivery day
export async function getOrdersForNextDeliveryDay(): Promise<{ orders: Order[], deliveryDate: Date | null }> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // First, find the next delivery date that has orders
    const q = query(
      ordersCollection,
      where('deliveryDate', '>=', dateToTimestamp(today)),
      orderBy('deliveryDate', 'asc'),
      limit(1)
    )

    const firstOrderSnapshot = await getDocs(q)

    if (firstOrderSnapshot.empty) {
      return { orders: [], deliveryDate: null }
    }

    // Get the delivery date from the first order
    const firstOrderData = firstOrderSnapshot.docs[0].data()
    const nextDeliveryDate = firstOrderData.deliveryDate instanceof Timestamp
      ? firstOrderData.deliveryDate.toDate()
      : new Date()

    // Set the date range for that specific day
    const startOfDay = new Date(nextDeliveryDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)

    // Now get all orders for that delivery date
    const ordersQuery = query(
      ordersCollection,
      where('deliveryDate', '>=', dateToTimestamp(startOfDay)),
      where('deliveryDate', '<', dateToTimestamp(endOfDay)),
      orderBy('deliveryDate', 'asc')
    )

    const ordersSnapshot = await getDocs(ordersQuery)
    const orders: Order[] = []

    ordersSnapshot.forEach((doc) => {
      const data = doc.data()
      orders.push({
        id: doc.id,
        ...data,
        orderDate: data.orderDate instanceof Timestamp ? data.orderDate.toDate() : new Date(),
        deliveryDate: data.deliveryDate instanceof Timestamp ? data.deliveryDate.toDate() : new Date(),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date()
      })
    })

    return { orders, deliveryDate: startOfDay }
  } catch (error: any) {
    // Suppress Firebase permission errors during build
    if (error?.code !== 'permission-denied') {
      console.error('Error in getOrdersForNextDeliveryDay:', error)
    }
    return { orders: [], deliveryDate: null }
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
  const historyData: OrderHistoryDoc = {
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
    const data = doc.data()
    history.push({
      id: doc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date()
    })
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
    const data = doc.data()
    orders.push({
      id: doc.id,
      ...data,
      orderDate: data.orderDate instanceof Timestamp ? data.orderDate.toDate() : new Date(),
      deliveryDate: data.deliveryDate instanceof Timestamp ? data.deliveryDate.toDate() : new Date(),
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date()
    })
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
    const data = doc.data()
    totalRevenue += data.totalAmount
    statusCounts[data.status] = (statusCounts[data.status] || 0) + 1
  })

  const totalOrders = querySnapshot.size

  return {
    totalOrders,
    totalRevenue,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    statusCounts
  }
}