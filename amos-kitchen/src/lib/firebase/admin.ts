// lib/firebase/admin.ts
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Validate required admin credentials
const adminCredentials = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
}

if (!adminCredentials.projectId || !adminCredentials.clientEmail || !adminCredentials.privateKey) {
  throw new Error(
    'Missing Firebase Admin credentials. Please ensure FIREBASE_ADMIN_PROJECT_ID, ' +
    'FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY are set in environment variables.'
  )
}

const firebaseAdminConfig = {
  credential: cert(adminCredentials as { projectId: string; clientEmail: string; privateKey: string })
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