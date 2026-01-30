// app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createCustomerSchema } from '@/lib/validators/customer'
import { normalizePhoneNumber } from '@/lib/validators/customer'
import {
    getCustomers,
    createCustomer,
    isPhoneNumberTaken,
    addCustomerPreference,
    getCustomerPreferencesBatch
} from '@/lib/firebase/dao/customers'
import { getOrdersByCustomersBatch } from '@/lib/firebase/dao/orders'
import { verifyIdToken } from '@/lib/firebase/admin'
import { AUTH_CONFIG } from '@/lib/constants/auth'
import type { Order, CustomerPreference } from '@/lib/types/firestore'

export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const token = request.cookies.get(AUTH_CONFIG.AUTH_COOKIE_NAME)?.value
        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const decodedToken = await verifyIdToken(token)
        if (!decodedToken) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            )
        }

        console.log('Fetching customers for user:', decodedToken.uid)
        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || undefined

        // Fetch customers - Firestore search is limited, filtering done client-side in DAO
        const { customers } = await getCustomers(search, 100)
        console.log(`Found ${customers.length} customers`)

        // Get all customer IDs that have valid IDs
        const validCustomerIds = customers
            .filter(c => c.id)
            .map(c => c.id as string)

        // OPTIMIZED: Batch load orders and preferences in parallel (replaces N+1 queries)
        // Before: 2N+1 queries (1 for customers + N for orders + N for preferences)
        // After: 3 queries (1 for customers + 1 batch for orders + parallel preferences)
        const [ordersMap, preferencesMap] = await Promise.all([
            getOrdersByCustomersBatch(validCustomerIds),
            getCustomerPreferencesBatch(validCustomerIds)
        ])

        console.log(`Batch loaded orders for ${ordersMap.size} customers, preferences for ${preferencesMap.size} customers`)

        // Process customers with pre-loaded data
        const customersWithStats = customers.map((customer) => {
            try {
                // Check if customer has valid ID
                if (!customer.id) {
                    console.warn('Customer without ID found:', customer.name)
                    return {
                        id: null,
                        name: customer.name,
                        phone: customer.phone,
                        email: customer.email,
                        address: customer.address,
                        notes: customer.notes,
                        preferences: [],
                        createdAt: customer.createdAt instanceof Date
                            ? customer.createdAt.toISOString()
                            : new Date().toISOString(),
                        updatedAt: customer.updatedAt instanceof Date
                            ? customer.updatedAt.toISOString()
                            : new Date().toISOString(),
                        orderCount: 0,
                        totalSpent: 0,
                        lastOrderDate: null
                    }
                }

                // Get pre-loaded orders and preferences from maps
                const orders = ordersMap.get(customer.id) || []
                const preferences = preferencesMap.get(customer.id) || []

                // Calculate statistics
                const orderCount = orders.length
                const totalSpent = orders.reduce(
                    (sum, order) => sum + (order.totalAmount || 0),
                    0
                )

                // Calculate last order date (orders are already sorted desc by createdAt)
                let lastOrderDate = null
                if (orders.length > 0 && orders[0].createdAt) {
                    lastOrderDate = orders[0].createdAt
                }

                return {
                    id: customer.id,
                    name: customer.name,
                    phone: customer.phone,
                    email: customer.email,
                    address: customer.address,
                    notes: customer.notes,
                    preferences,
                    createdAt: customer.createdAt instanceof Date
                        ? customer.createdAt.toISOString()
                        : new Date().toISOString(),
                    updatedAt: customer.updatedAt instanceof Date
                        ? customer.updatedAt.toISOString()
                        : new Date().toISOString(),
                    orderCount,
                    totalSpent,
                    lastOrderDate: lastOrderDate instanceof Date ? lastOrderDate.toISOString() : lastOrderDate
                }
            } catch (error) {
                console.error(`Error processing customer ${customer.id}:`, error)
                return {
                    id: customer.id || null,
                    name: customer.name,
                    phone: customer.phone,
                    email: customer.email,
                    address: customer.address,
                    notes: customer.notes,
                    preferences: [],
                    createdAt: customer.createdAt instanceof Date
                        ? customer.createdAt.toISOString()
                        : new Date().toISOString(),
                    updatedAt: customer.updatedAt instanceof Date
                        ? customer.updatedAt.toISOString()
                        : new Date().toISOString(),
                    orderCount: 0,
                    totalSpent: 0,
                    lastOrderDate: null
                }
            }
        })

        console.log(`Successfully processed ${customersWithStats.length} customers`)

        return NextResponse.json(customersWithStats)
    } catch (error) {
        console.error('Error fetching customers:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const errorStack = error instanceof Error ? error.stack : undefined
        console.error('Error details:', errorMessage)
        if (errorStack) {
            console.error('Stack trace:', errorStack)
        }
        return NextResponse.json(
            { error: 'Failed to fetch customers', details: errorMessage },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('POST /api/customers - Starting customer creation')
        const body = await request.json()
        console.log('Request body:', body)

        // Validate input using the imported schema
        const validatedData = createCustomerSchema.parse(body)
        console.log('Validated data:', validatedData)

        // Normalize phone number
        const normalizedPhone = normalizePhoneNumber(validatedData.phone)

        // Check if phone number already exists
        const phoneExists = await isPhoneNumberTaken(normalizedPhone)

        if (phoneExists) {
            return NextResponse.json(
                { error: 'מספר טלפון זה כבר קיים במערכת' },
                { status: 400 }
            )
        }

        // Create customer
        console.log('Creating customer in Firestore...')
        const customerId = await createCustomer({
            name: validatedData.name.trim(),
            phone: normalizedPhone,
            email: validatedData.email?.trim() || null,
            address: validatedData.address?.trim() || null,
            notes: validatedData.notes?.trim() || null
        })
        console.log('Customer created with ID:', customerId)

        // Add preferences if provided
        const preferences = []
        if (validatedData.preferences && validatedData.preferences.length > 0) {
            for (const pref of validatedData.preferences) {
                await addCustomerPreference(customerId, {
                    type: pref.type,
                    value: pref.value.trim(),
                    notes: pref.notes?.trim() || null
                })
                preferences.push(pref)
            }
        }

        // Return the created customer data
        const customer = {
            id: customerId,
            name: validatedData.name.trim(),
            phone: normalizedPhone,
            email: validatedData.email?.trim() || null,
            address: validatedData.address?.trim() || null,
            notes: validatedData.notes?.trim() || null,
            preferences
        }

        return NextResponse.json(customer, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            )
        }


        console.error('Error creating customer:', error)
        return NextResponse.json(
            { error: 'Failed to create customer' },
            { status: 500 }
        )
    }
}
