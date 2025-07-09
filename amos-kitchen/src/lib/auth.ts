// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    session: {
        strategy: 'jwt'
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                // For now, create a simple admin user
                // In production, you would check against your database
                const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
                const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

                if (credentials.email === adminEmail && credentials.password === adminPassword) {
                    return {
                        id: '1',
                        email: adminEmail,
                        name: 'Admin User'
                    }
                }

                // TODO: Implement actual user authentication with database
                // const user = await prisma.user.findUnique({
                //   where: { email: credentials.email }
                // })
                //
                // if (!user || !await bcrypt.compare(credentials.password, user.password)) {
                //   return null
                // }
                //
                // return {
                //   id: user.id,
                //   email: user.email,
                //   name: user.name
                // }

                return null
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.id = token.id as string
            }
            return session
        }
    },
    secret: process.env.NEXTAUTH_SECRET || 'your-development-secret-key',
}

// Helper function to get server session
import { getServerSession as getNextAuthServerSession } from 'next-auth'

export async function getServerSession() {
    return getNextAuthServerSession(authOptions)
}
