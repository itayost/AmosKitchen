// lib/firebase/auth.ts
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword
} from 'firebase/auth'
import { auth } from './config'

// Sign in with email and password
export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

// Sign up with email and password
export async function signUp(email: string, password: string, displayName?: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    // Update display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName })
    }

    return { user: userCredential.user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

// Sign out
export async function logOut() {
  try {
    await signOut(auth)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Reset password
export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Update user profile
export async function updateUserProfile(updates: { displayName?: string; photoURL?: string }) {
  try {
    if (!auth.currentUser) throw new Error('No authenticated user')
    await updateProfile(auth.currentUser, updates)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Update user email
export async function updateUserEmail(newEmail: string) {
  try {
    if (!auth.currentUser) throw new Error('No authenticated user')
    await updateEmail(auth.currentUser, newEmail)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Update user password
export async function updateUserPassword(newPassword: string) {
  try {
    if (!auth.currentUser) throw new Error('No authenticated user')
    await updatePassword(auth.currentUser, newPassword)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser
}

// Listen to auth state changes
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

// Get ID token
export async function getIdToken(): Promise<string | null> {
  try {
    const user = auth.currentUser
    if (!user) return null
    return await user.getIdToken()
  } catch (error) {
    console.error('Error getting ID token:', error)
    return null
  }
}