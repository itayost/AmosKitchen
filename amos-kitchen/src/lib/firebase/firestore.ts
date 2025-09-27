// lib/firebase/firestore.ts
import {
  collection,
  doc,
  CollectionReference,
  DocumentReference,
  Timestamp,
  serverTimestamp,
  FieldValue
} from 'firebase/firestore'
import { db } from './config'
import type {
  Customer,
  CustomerPreference,
  Dish,
  Order,
  OrderHistory,
  OrderCounter
} from '@/lib/types/firestore'

// Collection references
export const customersCollection = collection(db, 'customers') as CollectionReference<Customer>
export const dishesCollection = collection(db, 'dishes') as CollectionReference<Dish>
export const ordersCollection = collection(db, 'orders') as CollectionReference<Order>
export const countersCollection = collection(db, 'counters') as CollectionReference<OrderCounter>

// Helper function to get subcollection references
export const customerPreferencesCollection = (customerId: string) =>
  collection(db, 'customers', customerId, 'preferences') as CollectionReference<CustomerPreference>

export const orderHistoryCollection = (orderId: string) =>
  collection(db, 'orders', orderId, 'history') as CollectionReference<OrderHistory>

// Document references
export const getCustomerDoc = (customerId: string) =>
  doc(customersCollection, customerId)

export const getDishDoc = (dishId: string) =>
  doc(dishesCollection, dishId)

export const getOrderDoc = (orderId: string) =>
  doc(ordersCollection, orderId)

export const getOrderCounterDoc = (year: number) =>
  doc(countersCollection, `orderNumbers_${year}`)

// Timestamp helpers
export const createTimestamp = () => Timestamp.now()
export const getServerTimestamp = () => serverTimestamp()

// Convert Firestore timestamp to Date
export const timestampToDate = (timestamp: Timestamp | FieldValue | undefined): Date => {
  if (!timestamp || !(timestamp instanceof Timestamp)) {
    return new Date()
  }
  return timestamp.toDate()
}

// Convert Date to Firestore timestamp
export const dateToTimestamp = (date: Date | string): Timestamp => {
  if (typeof date === 'string') {
    return Timestamp.fromDate(new Date(date))
  }
  return Timestamp.fromDate(date)
}