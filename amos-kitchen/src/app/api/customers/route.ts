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
    getCustomerPreferences
} from '@/lib/firebase/dao/customers'
import { getOrdersByCustomer } from '@/lib/firebase/dao/orders'
import { verifyIdToken } from '@/lib/firebase/admin'
import type { Order, CustomerPreference } from '@/lib/types/firestore'

export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const token = request.cookies.get('firebase-auth-token')?.value
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
        const { customers } = await getCustomers(search, 100) // Get more customers for better search
        console.log(`Found ${customers.length} customers`)

        // Fetch order statistics and preferences for each customer
        const customersWithStats = await Promise.all(
            customers.map(async (customer) => {
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
                            createdAt: customer.createdAt.toISOString(),
                            updatedAt: customer.updatedAt.toISOString(),
                            orderCount: 0,
                            totalSpent: 0,
                            lastOrderDate: null
                        }
                    }

                    // Get customer orders with error handling
                    let orders: Order[] = []
                    try {
                        orders = await getOrdersByCustomer(customer.id)
                    } catch (error) {
                        console.warn(`Failed to get orders for customer ${customer.id}:`, error)
                    }

                    // Get customer preferences with error handling
                    let preferences: CustomerPreference[] = []
                    try {
                        preferences = await getCustomerPreferences(customer.id)
                    } catch (error) {
                        console.warn(`Failed to get preferences for customer ${customer.id}:`, error)
                    }

                    // Calculate statistics
                    const orderCount = orders.length
                    const totalSpent = orders.reduce(
                        (sum, order) => sum + (order.totalAmount || 0),
                        0
                    )

                    // Safer date calculation
                    let lastOrderDate = null
                    if (orders.length > 0) {
                        try {
                            const sortedOrders = orders
                                .filter(order => order.createdAt)
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

                            if (sortedOrders.length > 0) {
                                lastOrderDate = sortedOrders[0].createdAt
                            }
                        } catch (error) {
                            console.warn(`Failed to calculate last order date for customer ${customer.id}:`, error)
                        }
                    }

                    return {
                        id: customer.id,
                        name: customer.name,
                        phone: customer.phone,
                        email: customer.email,
                        address: customer.address,
                        notes: customer.notes,
                        preferences,
                        // Convert Firestore Timestamps to ISO strings for JSON serialization
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
                    // Return basic customer data if processing fails
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
        )

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
