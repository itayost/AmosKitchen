// lib/firebase/server/orders.ts
// Server-side order operations using Firebase Admin SDK
// This bypasses Security Rules and should only be used in API routes

import { adminDb } from '../admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import type { Order, OrderHistory } from '@/lib/types/firestore'

// Collection references
const ordersCollection = adminDb.collection('orders')
const getOrderDoc = (orderId: string) => ordersCollection.doc(orderId)
const orderHistoryCollection = (orderId: string) =>
  ordersCollection.doc(orderId).collection('history')

// Get order by ID
export async function getOrderById(id: string): Promise<Order | null> {
  const docSnap = await getOrderDoc(id).get()

  if (!docSnap.exists) {
    return null
  }

  const data = docSnap.data()!
  return {
    id: docSnap.id,
    ...data,
    orderDate: data.orderDate instanceof Timestamp ? data.orderDate.toDate() : new Date(),
    deliveryDate: data.deliveryDate instanceof Timestamp ? data.deliveryDate.toDate() : new Date(),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date()
  } as Order
}

// Update order
export async function updateOrder(
  id: string,
  data: Partial<Order>
): Promise<void> {
  const docRef = getOrderDoc(id)

  const updateData: any = {
    ...data,
    updatedAt: FieldValue.serverTimestamp()
  }

  // Convert dates to timestamps if needed
  if (updateData.deliveryDate instanceof Date) {
    updateData.deliveryDate = Timestamp.fromDate(updateData.deliveryDate)
  }
  if (updateData.orderDate instanceof Date) {
    updateData.orderDate = Timestamp.fromDate(updateData.orderDate)
  }

  // Remove id if present
  delete updateData.id

  await docRef.update(updateData)
}

// Update order status
export async function updateOrderStatus(
  id: string,
  status: Order['status']
): Promise<void> {
  console.log(`[Server] Updating order ${id} status to ${status}`)
  await updateOrder(id, { status })
  console.log(`[Server] Successfully updated order ${id} status to ${status}`)
}

// Add order history entry
export async function addOrderHistory(
  orderId: string,
  data: Omit<OrderHistory, 'id' | 'orderId' | 'createdAt'>
): Promise<void> {
  console.log(`[Server] Adding order history for order ${orderId}:`, data)

  const historyData: any = {
    ...data,
    orderId,
    createdAt: FieldValue.serverTimestamp()
  }

  // Only include userId if it's not null/undefined
  if (data.userId === null || data.userId === undefined) {
    delete historyData.userId
  }

  await orderHistoryCollection(orderId).add(historyData)
  console.log(`[Server] Successfully added order history for order ${orderId}`)
}

// Get order history
export async function getOrderHistory(orderId: string): Promise<OrderHistory[]> {
  const snapshot = await orderHistoryCollection(orderId)
    .orderBy('createdAt', 'desc')
    .get()

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date()
    } as OrderHistory
  })
}

// Delete order (with history)
export async function deleteOrder(id: string): Promise<void> {
  const batch = adminDb.batch()

  // Delete history entries first
  const historySnapshot = await orderHistoryCollection(id).get()
  historySnapshot.forEach((doc) => {
    batch.delete(doc.ref)
  })

  // Delete order
  batch.delete(getOrderDoc(id))

  await batch.commit()
}
