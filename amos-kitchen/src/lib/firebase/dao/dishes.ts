// lib/firebase/dao/dishes.ts
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
  QueryConstraint
} from 'firebase/firestore'
import {
  dishesCollection,
  getDishDoc,
  getServerTimestamp
} from '../firestore'
import type { Dish } from '@/lib/types/firestore'

// Create a new dish
export async function createDish(data: Omit<Dish, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const dishData: Dish = {
    ...data,
    createdAt: getServerTimestamp(),
    updatedAt: getServerTimestamp()
  }

  const docRef = await addDoc(dishesCollection, dishData)
  return docRef.id
}

// Get dish by ID
export async function getDishById(id: string): Promise<Dish | null> {
  try {
    console.log('Getting dish by ID from Firestore:', id)
    const docRef = getDishDoc(id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      console.log('Dish document does not exist in Firestore:', id)
      return null
    }

    const data = docSnap.data()
    const dishData = {
      id: docSnap.id,
      ...data,
      // Convert Firestore Timestamps to Dates
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
    } as Dish

    console.log('Dish data retrieved:', dishData)
    return dishData
  } catch (error) {
    console.error('Error getting dish from Firestore:', error)
    throw error
  }
}

// Get all dishes with filters
export async function getDishes(
  filters?: {
    search?: string
    category?: string
    available?: boolean
  }
): Promise<Dish[]> {
  const constraints: QueryConstraint[] = [orderBy('name', 'asc')]

  // Add filters
  if (filters?.category && filters.category !== 'all') {
    constraints.push(where('category', '==', filters.category.toUpperCase()))
  }

  if (filters?.available !== undefined) {
    constraints.push(where('isAvailable', '==', filters.available))
  }

  const q = query(dishesCollection, ...constraints)
  const querySnapshot = await getDocs(q)

  const dishes: Dish[] = []
  querySnapshot.forEach((doc) => {
    const data = doc.data()
    const dish = {
      id: doc.id,
      ...data,
      // Convert Firestore Timestamps to Dates
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
    } as Dish

    // Client-side search filter (Firestore doesn't support text search natively)
    if (!filters?.search ||
        dish.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        dish.description?.toLowerCase().includes(filters.search.toLowerCase())) {
      dishes.push(dish)
    }
  })

  return dishes
}

// Get available dishes
export async function getAvailableDishes(): Promise<Dish[]> {
  const q = query(
    dishesCollection,
    where('isAvailable', '==', true),
    orderBy('category', 'asc'),
    orderBy('name', 'asc')
  )
  const querySnapshot = await getDocs(q)

  const dishes: Dish[] = []
  querySnapshot.forEach((doc) => {
    const data = doc.data()
    dishes.push({
      id: doc.id,
      ...data,
      // Convert Firestore Timestamps to Dates
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
    } as Dish)
  })

  return dishes
}

// Get dishes by category
export async function getDishesByCategory(category: string): Promise<Dish[]> {
  const q = query(
    dishesCollection,
    where('category', '==', category.toUpperCase()),
    where('isAvailable', '==', true),
    orderBy('name', 'asc')
  )
  const querySnapshot = await getDocs(q)

  const dishes: Dish[] = []
  querySnapshot.forEach((doc) => {
    dishes.push({
      id: doc.id,
      ...doc.data()
    } as Dish)
  })

  return dishes
}

// Update dish
export async function updateDish(id: string, data: Partial<Dish>): Promise<void> {
  const docRef = getDishDoc(id)

  const updateData = {
    ...data,
    updatedAt: getServerTimestamp()
  }

  // Remove id if present
  delete updateData.id

  await updateDoc(docRef, updateData)
}

// Delete dish
export async function deleteDish(id: string): Promise<void> {
  const docRef = getDishDoc(id)
  await deleteDoc(docRef)
}

// Toggle dish availability
export async function toggleDishAvailability(id: string, isAvailable: boolean): Promise<void> {
  const docRef = getDishDoc(id)
  await updateDoc(docRef, {
    isAvailable,
    updatedAt: getServerTimestamp()
  })
}

// Check if dish exists
export async function isDishExists(id: string): Promise<boolean> {
  const docRef = getDishDoc(id)
  const docSnap = await getDoc(docRef)
  return docSnap.exists()
}

// Get dishes by IDs
export async function getDishesByIds(ids: string[]): Promise<Dish[]> {
  const dishes: Dish[] = []

  for (const id of ids) {
    const dish = await getDishById(id)
    if (dish) {
      dishes.push(dish)
    }
  }

  return dishes
}

// Get dish count by category
export async function getDishCountByCategory(): Promise<Record<string, number>> {
  const q = query(dishesCollection)
  const querySnapshot = await getDocs(q)

  const counts: Record<string, number> = {}
  querySnapshot.forEach((doc) => {
    const dish = doc.data() as Dish
    const category = dish.category || 'other'
    counts[category] = (counts[category] || 0) + 1
  })

  return counts
}