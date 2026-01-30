// lib/firebase/server/dishes.ts
// Server-side dish operations using Firebase Admin SDK

import { adminDb } from '../admin'
import { Timestamp } from 'firebase-admin/firestore'
import type { Dish } from '@/lib/types/firestore'

// Collection reference
const dishesCollection = adminDb.collection('dishes')

// Get dish by ID
export async function getDishById(id: string): Promise<Dish | null> {
  const docSnap = await dishesCollection.doc(id).get()

  if (!docSnap.exists) {
    return null
  }

  const data = docSnap.data()!
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date()
  } as Dish
}

// Get dishes by IDs
export async function getDishesByIds(ids: string[]): Promise<Dish[]> {
  if (ids.length === 0) return []

  const dishes: Dish[] = []

  for (const id of ids) {
    const dish = await getDishById(id)
    if (dish) {
      dishes.push(dish)
    }
  }

  return dishes
}
