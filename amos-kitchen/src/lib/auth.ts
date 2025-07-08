// lib/auth.ts
export interface User {
    id: string
    email: string
    created_at: string
}

export interface AuthError {
    message: string
    status?: number
}

export interface LoginCredentials {
    email: string
    password: string
}
