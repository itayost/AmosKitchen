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

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || undefined

        // Fetch customers - Firestore search is limited, filtering done client-side in DAO
        const { customers } = await getCustomers(search, 100) // Get more customers for better search

        // Fetch order statistics and preferences for each customer
        const customersWithStats = await Promise.all(
            customers.map(async (customer) => {
                // Get customer orders
                const orders = await getOrdersByCustomer(customer.id!)

                // Get customer preferences
                const preferences = await getCustomerPreferences(customer.id!)

                // Calculate statistics
                const orderCount = orders.length
                const totalSpent = orders.reduce(
                    (sum, order) => sum + order.totalAmount,
                    0
                )
                const lastOrderDate = orders.length > 0
                    ? orders.reduce((latest, order) => {
                        const orderDate = order.createdAt
                        return orderDate > latest ? orderDate : latest
                    }, orders[0].createdAt)
                    : null

                return {
                    id: customer.id,
                    name: customer.name,
                    phone: customer.phone,
                    email: customer.email,
                    address: customer.address,
                    notes: customer.notes,
                    preferences,
                    createdAt: customer.createdAt,
                    updatedAt: customer.updatedAt,
                    orderCount,
                    totalSpent,
                    lastOrderDate
                }
            })
        )

        return NextResponse.json(customersWithStats)
    } catch (error) {
        console.error('Error fetching customers:', error)
        return NextResponse.json(
            { error: 'Failed to fetch customers' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate input using the imported schema
        const validatedData = createCustomerSchema.parse(body)

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
        const customerId = await createCustomer({
            name: validatedData.name.trim(),
            phone: normalizedPhone,
            email: validatedData.email?.trim() || null,
            address: validatedData.address?.trim() || null,
            notes: validatedData.notes?.trim() || null
        })

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
