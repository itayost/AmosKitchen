// lib/firebase/dao/customers.ts
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
  Timestamp
} from 'firebase/firestore'
import {
  customersCollection,
  customerPreferencesCollection,
  getCustomerDoc,
  getServerTimestamp,
  dateToTimestamp,
  timestampToDate
} from '../firestore'
import { db } from '../config'
import type { Customer, CustomerPreference, CustomerDoc, CustomerPreferenceDoc } from '@/lib/types/firestore'

// Create a new customer
export async function createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const customerData: CustomerDoc = {
      ...data,
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp()
    }

    const docRef = await addDoc(customersCollection, customerData)

    return docRef.id
  } catch (error) {
    console.error('Error creating customer in Firestore:', error)
    throw error
  }
}

// Get customer by ID
export async function getCustomerById(id: string): Promise<Customer | null> {
  const docRef = getCustomerDoc(id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data()
  return {
    id: docSnap.id,
    ...data,
    // Convert Firestore Timestamps to Dates
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date()
  }
}

// Get customer by phone
export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  const q = query(customersCollection, where('phone', '==', phone), limit(1))
  const querySnapshot = await getDocs(q)

  if (querySnapshot.empty) {
    return null
  }

  const doc = querySnapshot.docs[0]
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    // Convert Firestore Timestamps to Dates
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date()
  }
}

// Get all customers with filters
export async function getCustomers(
  searchTerm?: string,
  pageSize: number = 10,
  lastDoc?: DocumentSnapshot
): Promise<{ customers: Customer[], lastDoc: DocumentSnapshot | null, total: number }> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(pageSize)]

  if (lastDoc) {
    constraints.push(startAfter(lastDoc))
  }

  // Note: Firestore doesn't support text search natively
  // For production, consider using Algolia or Elasticsearch
  // For now, we'll fetch all and filter client-side for search
  const q = query(customersCollection, ...constraints)
  const querySnapshot = await getDocs(q)

  const customers: Customer[] = []
  querySnapshot.forEach((doc) => {
    const data = doc.data()
    const customer: Customer = {
      id: doc.id,
      ...data,
      // Convert Firestore Timestamps to Dates
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date()
    }

    // Client-side search filter
    if (!searchTerm ||
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())) {
      customers.push(customer)
    }
  })

  // Get total count
  const countSnapshot = await getDocs(query(customersCollection))
  const total = countSnapshot.size

  return {
    customers,
    lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
    total
  }
}

// Update customer
export async function updateCustomer(id: string, data: Partial<Customer>): Promise<void> {
  const docRef = getCustomerDoc(id)

  const updateData = {
    ...data,
    updatedAt: getServerTimestamp()
  }

  // Remove id if present
  delete updateData.id

  await updateDoc(docRef, updateData)
}

// Delete customer
export async function deleteCustomer(id: string): Promise<void> {
  const docRef = getCustomerDoc(id)

  // Delete all preferences first
  const preferencesSnapshot = await getDocs(customerPreferencesCollection(id))
  const batch = writeBatch(db)

  preferencesSnapshot.forEach((doc) => {
    batch.delete(doc.ref)
  })

  await batch.commit()

  // Delete customer
  await deleteDoc(docRef)
}

// Customer Preferences Functions

// Add preference
export async function addCustomerPreference(
  customerId: string,
  preference: Omit<CustomerPreference, 'id' | 'customerId' | 'createdAt'>
): Promise<string> {
  const preferenceData: CustomerPreferenceDoc = {
    ...preference,
    customerId,
    createdAt: getServerTimestamp()
  }

  const docRef = await addDoc(customerPreferencesCollection(customerId), preferenceData)
  return docRef.id
}

// Get customer preferences
export async function getCustomerPreferences(customerId: string): Promise<CustomerPreference[]> {
  const querySnapshot = await getDocs(customerPreferencesCollection(customerId))

  const preferences: CustomerPreference[] = []
  querySnapshot.forEach((doc) => {
    const data = doc.data()
    preferences.push({
      id: doc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date()
    })
  })

  return preferences
}

// Delete preference
export async function deleteCustomerPreference(customerId: string, preferenceId: string): Promise<void> {
  const docRef = doc(customerPreferencesCollection(customerId), preferenceId)
  await deleteDoc(docRef)
}

// Get customer with preferences
export async function getCustomerWithPreferences(id: string): Promise<(Customer & { preferences: CustomerPreference[] }) | null> {
  const customer = await getCustomerById(id)
  if (!customer) return null

  const preferences = await getCustomerPreferences(id)

  return {
    ...customer,
    preferences
  }
}

// Check if phone number exists (for validation)
export async function isPhoneNumberTaken(phone: string, excludeId?: string): Promise<boolean> {
  const q = query(customersCollection, where('phone', '==', phone), limit(1))
  const querySnapshot = await getDocs(q)

  if (querySnapshot.empty) return false

  const doc = querySnapshot.docs[0]
  return excludeId ? doc.id !== excludeId : true
}