// lib/firebase/admin.ts
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "amos-kitchen",
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@amos-kitchen.iam.gserviceaccount.com",
    privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, '\n')
  })
}

// Initialize admin app
const adminApp = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApp()

// Admin services
export const adminAuth = getAuth(adminApp)
export const adminDb = getFirestore(adminApp)

// Helper function to verify ID token
export async function verifyIdToken(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token)
    return decodedToken
  } catch (error) {
    console.error('Error verifying ID token:', error)
    return null
  }
}

// Helper function to get user by email
export async function getUserByEmail(email: string) {
  try {
    const user = await adminAuth.getUserByEmail(email)
    return user
  } catch (error) {
    console.error('Error getting user by email:', error)
    return null
  }
}

// Helper function to create custom token
export async function createCustomToken(uid: string) {
  try {
    const token = await adminAuth.createCustomToken(uid)
    return token
  } catch (error) {
    console.error('Error creating custom token:', error)
    return null
  }
}

export default adminApp