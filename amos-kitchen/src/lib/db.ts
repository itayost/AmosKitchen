// src/lib/db.ts
import { PrismaClient } from '@prisma/client'

declare global {
    var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        // Add these options to handle Supabase pooler issues
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        },
    })
}

// Ensure we use a singleton in development to avoid connection issues
export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma
}
