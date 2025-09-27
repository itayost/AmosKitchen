// lib/hooks/use-auth.ts
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'firebase/auth'
import { onAuthStateChange, logOut } from '@/lib/firebase/auth'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const unsubscribe = onAuthStateChange((firebaseUser) => {
            setUser(firebaseUser)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const signOut = async () => {
        try {
            await logOut()
            router.push('/login')
        } catch (error) {
            console.error('Error signing out:', error)
        }
    }

    return {
        user,
        loading,
        signOut,
    }
}