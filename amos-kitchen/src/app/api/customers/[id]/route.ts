// app/api/customers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { updateCustomerSchema } from '@/lib/validators/customer'
import { normalizePhoneNumber } from '@/lib/validators/customer'
import {
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    isPhoneNumberTaken,
    getCustomerPreferences,
    addCustomerPreference,
    deleteCustomerPreference
} from '@/lib/firebase/dao/customers'
import { getOrdersByCustomer } from '@/lib/firebase/dao/orders'
import { getDishesByIds } from '@/lib/firebase/dao/dishes'

// Force this route to be dynamically rendered
export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const customer = await getCustomerById(params.id)

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }

        // Get customer preferences
        const preferences = await getCustomerPreferences(params.id)

        // Get customer orders
        const orders = await getOrdersByCustomer(params.id)

        // Get all unique dish IDs from orders
        const dishIds = new Set<string>()
        orders.forEach(order => {
            order.items.forEach(item => {
                dishIds.add(item.dishId)
            })
        })

        // Fetch dish details
        const dishes = await getDishesByIds(Array.from(dishIds))
        const dishMap = new Map(dishes.map(d => [d.id, d]))

        // Transform orders with dish details
        const ordersWithDishes = orders.map(order => ({
            ...order,
            orderItems: order.items.map(item => ({
                ...item,
                dish: dishMap.get(item.dishId) || { name: 'Unknown Dish' }
            }))
        }))

        // Calculate statistics for the customer
        const orderCount = orders.length
        const totalSpent = orders.reduce(
            (sum, order) => sum + order.totalAmount,
            0
        )

        // Calculate favorite dishes
        const dishCounts = new Map<string, { count: number; name: string }>()
        orders.forEach(order => {
            order.items.forEach(item => {
                const dish = dishMap.get(item.dishId)
                if (dish) {
                    const key = item.dishId
                    if (dishCounts.has(key)) {
                        dishCounts.get(key)!.count += item.quantity
                    } else {
                        dishCounts.set(key, { count: item.quantity, name: dish.name })
                    }
                }
            })
        })

        const favoriteDishes = Array.from(dishCounts.entries())
            .map(([dishId, data]) => ({
                dishId,
                dishName: data.name,
                totalOrdered: data.count
            }))
            .sort((a, b) => b.totalOrdered - a.totalOrdered)
            .slice(0, 5)

        const customerWithStats = {
            ...customer,
            preferences,
            orders: ordersWithDishes,
            orderCount,
            totalSpent,
            favoriteDishes
        }

        return NextResponse.json(customerWithStats)
    } catch (error) {
        console.error('Error fetching customer:', error)
        return NextResponse.json(
            { error: 'Failed to fetch customer' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()

        // Validate input
        const validatedData = updateCustomerSchema.parse(body)

        // Check if customer exists
        const existingCustomer = await getCustomerById(params.id)

        if (!existingCustomer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }

        // Prepare update data
        const updateData: any = {
            ...(validatedData.name && { name: validatedData.name.trim() }),
            ...(validatedData.email !== undefined && { email: validatedData.email?.trim() || null }),
            ...(validatedData.address !== undefined && { address: validatedData.address?.trim() || null }),
            ...(validatedData.notes !== undefined && { notes: validatedData.notes?.trim() || null })
        }

        // If phone is being updated, normalize and check if it's already in use
        if (validatedData.phone) {
            const normalizedPhone = normalizePhoneNumber(validatedData.phone)

            if (normalizedPhone !== existingCustomer.phone) {
                const phoneExists = await isPhoneNumberTaken(normalizedPhone, params.id)

                if (phoneExists) {
                    return NextResponse.json(
                        { error: 'מספר טלפון זה כבר קיים במערכת' },
                        { status: 400 }
                    )
                }

                updateData.phone = normalizedPhone
            }
        }

        // Update customer
        await updateCustomer(params.id, updateData)

        // Handle preferences update if provided
        if (validatedData.preferences !== undefined) {
            // Get existing preferences to delete them
            const existingPreferences = await getCustomerPreferences(params.id)

            // Delete all existing preferences
            for (const pref of existingPreferences) {
                if (pref.id) {
                    await deleteCustomerPreference(params.id, pref.id)
                }
            }

            // Add new preferences
            const preferences = []
            if (validatedData.preferences && validatedData.preferences.length > 0) {
                for (const pref of validatedData.preferences) {
                    const prefId = await addCustomerPreference(params.id, {
                        type: pref.type,
                        value: pref.value.trim(),
                        notes: pref.notes?.trim() || null
                    })
                    preferences.push({
                        id: prefId,
                        ...pref
                    })
                }
            }
        }

        // Get updated customer with all details
        const updatedCustomer = await getCustomerById(params.id)
        const preferences = await getCustomerPreferences(params.id)
        const orders = await getOrdersByCustomer(params.id)

        // Get all unique dish IDs from orders
        const dishIds = new Set<string>()
        orders.forEach(order => {
            order.items.forEach(item => {
                dishIds.add(item.dishId)
            })
        })

        // Fetch dish details
        const dishes = await getDishesByIds(Array.from(dishIds))
        const dishMap = new Map(dishes.map(d => [d.id, d]))

        // Transform orders with dish details
        const ordersWithDishes = orders.map(order => ({
            ...order,
            orderItems: order.items.map(item => ({
                ...item,
                dish: dishMap.get(item.dishId) || { name: 'Unknown Dish' }
            }))
        }))

        const customerResponse = {
            ...updatedCustomer,
            preferences,
            orders: ordersWithDishes
        }

        return NextResponse.json(customerResponse)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            )
        }


        console.error('Error updating customer:', error)
        return NextResponse.json(
            { error: 'Failed to update customer' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check if customer exists
        const existingCustomer = await getCustomerById(params.id)

        if (!existingCustomer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }

        // Check if customer has orders
        const orders = await getOrdersByCustomer(params.id)
        if (orders.length > 0) {
            return NextResponse.json(
                { error: 'לא ניתן למחוק לקוח עם הזמנות קיימות' },
                { status: 400 }
            )
        }

        // Get preferences count before deletion
        const preferences = await getCustomerPreferences(params.id)
        const preferencesCount = preferences.length

        // Delete customer (preferences will be deleted by the DAO)
        await deleteCustomer(params.id)

        return NextResponse.json({
            message: 'Customer deleted successfully',
            deletedPreferences: preferencesCount
        })
    } catch (error) {
        console.error('Error deleting customer:', error)
        return NextResponse.json(
            { error: 'Failed to delete customer' },
            { status: 500 }
        )
    }
}
