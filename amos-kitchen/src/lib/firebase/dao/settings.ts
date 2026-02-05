// lib/firebase/dao/settings.ts
import { getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { getSettingsDoc, getServerTimestamp } from '../firestore'
import type { AppSettings } from '@/lib/types/firestore'

export const DEFAULT_DELIVERY_FEE = 15

const DEFAULT_SETTINGS: AppSettings = {
  deliveryFee: DEFAULT_DELIVERY_FEE,
  updatedAt: new Date()
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const docSnap = await getDoc(getSettingsDoc())

    if (!docSnap.exists()) {
      return DEFAULT_SETTINGS
    }

    const data = docSnap.data()
    return {
      id: docSnap.id,
      deliveryFee: data.deliveryFee ?? DEFAULT_DELIVERY_FEE,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date()
    }
  } catch (error) {
    console.error('Error fetching settings:', error)
    return DEFAULT_SETTINGS
  }
}

export async function updateSettings(data: Partial<Pick<AppSettings, 'deliveryFee'>>): Promise<void> {
  await setDoc(getSettingsDoc(), {
    ...data,
    updatedAt: getServerTimestamp()
  }, { merge: true })
}
