// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
    createOrder,
    getOrders,
    addOrderHistory
} from '@/lib/firebase/dao/orders'
import { getCustomerById } from '@/lib/firebase/dao/customers'
import { getDishesByIds } from '@/lib/firebase/dao/dishes'
import { verifyAuth } from '@/lib/api/auth-middleware'

// Validation schema for order creation
const createOrderSchema = z.object({
    customerId: z.string().min(1),
    deliveryDate: z.string(),
    deliveryAddress: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
        dishId: z.string().min(1),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
        notes: z.string().optional()
    })).min(1)
})



export async function GET(request: NextRequest) {
    // Verify authentication first, outside try-catch to ensure proper 401 responses
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
        console.log('Authentication failed - no valid token')
        return auth.response
    }

    try {
        console.log('Orders API called for user:', auth.user?.uid)

        // Get query parameters
        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || 'all'
        const dateRange = searchParams.get('dateRange') || 'all'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')

        console.log('Query parameters:', { search, status, dateRange, page, limit })

        // Build filters for Firestore
        const filters: any = {
            search,
            status: status !== 'all' ? status : undefined,
            dateRange: dateRange !== 'all' ? dateRange : undefined
        }

        // Fetch orders from Firestore
        console.log('Fetching orders with filters:', filters)
        const { orders, total } = await getOrders(filters, limit)
        console.log(`Fetched ${orders.length} orders`)

        // Get dish details for all orders
        const allDishIds = new Set<string>()
        orders.forEach(order => {
            order.items.forEach(item => allDishIds.add(item.dishId))
        })

        console.log(`Fetching details for ${allDishIds.size} dishes`)
        const dishes = await getDishesByIds(Array.from(allDishIds))
        const dishMap = new Map(dishes.map(d => [d.id, d]))

        // Get customer details for orders that don't have customerData
        const customersToFetch = new Set<string>()
        orders.forEach(order => {
            if (!order.customerData && order.customerId) {
                customersToFetch.add(order.customerId)
            }
        })

        console.log(`Fetching details for ${customersToFetch.size} customers`)
        const customerMap = new Map()
        for (const customerId of Array.from(customersToFetch)) {
            const customer = await getCustomerById(customerId)
            if (customer) {
                customerMap.set(customerId, customer)
            }
        }

        // Transform orders to match frontend expectations
        const transformedOrders = orders.map(order => ({
            ...order,
            status: order.status.toLowerCase(),
            totalAmount: order.totalAmount,
            customer: order.customerData || customerMap.get(order.customerId) || {
                name: 'Unknown',
                phone: ''
            },
            orderItems: order.items.map(item => ({
                ...item,
                dish: dishMap.get(item.dishId) || { name: 'Unknown Dish' }
            })),
            items: order.items.map(item => ({
                ...item,
                dish: dishMap.get(item.dishId) || { name: 'Unknown Dish' }
            }))
        }))

        console.log('Successfully transformed orders, returning response')
        return NextResponse.json({
            orders: transformedOrders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error: any) {
        console.error('Error fetching orders:', error)
        console.error('Error name:', error?.name)
        console.error('Error code:', error?.code)
        console.error('Error message:', error?.message)
        console.error('Error stack:', error?.stack)

        // Return more specific error messages
        const errorMessage = error?.message || 'Failed to fetch orders'
        return NextResponse.json(
            {
                error: 'Failed to fetch orders',
                details: errorMessage,
                code: error?.code || 'UNKNOWN_ERROR'
            },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    // Verify authentication first, outside try-catch to ensure proper 401 responses
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
        return auth.response
    }

    try {
        const body = await request.json()
        console.log('Create order request by user:', auth.user?.uid, body)

        // Validate request body
        const validatedData = createOrderSchema.parse(body)

        // Verify customer exists
        const customer = await getCustomerById(validatedData.customerId)
        if (!customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }

        // Calculate total amount
        const totalAmount = validatedData.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity)
        }, 0)

        // Create order with Firestore
        const orderId = await createOrder({
            customerId: validatedData.customerId,
            orderDate: new Date(),
            deliveryDate: new Date(validatedData.deliveryDate),
            deliveryAddress: validatedData.deliveryAddress || customer.address || '',
            items: validatedData.items.map(item => ({
                dishId: item.dishId,
                dishName: '', // Will be filled by frontend or we can fetch
                quantity: item.quantity,
                price: item.price,
                notes: item.notes || ''
            })),
            totalAmount,
            status: 'NEW',
            notes: validatedData.notes || ''
        })

        // Get dish details to fill in dish names
        const dishIds = validatedData.items.map(item => item.dishId)
        const dishes = await getDishesByIds(dishIds)
        const dishMap = new Map(dishes.map(d => [d.id, d]))

        // Transform response
        const transformedOrder = {
            id: orderId,
            customerId: validatedData.customerId,
            customer,
            customerData: {
                name: customer.name,
                phone: customer.phone,
                email: customer.email
            },
            deliveryDate: validatedData.deliveryDate,
            deliveryAddress: validatedData.deliveryAddress || customer.address || '',
            status: 'new',
            totalAmount,
            notes: validatedData.notes || '',
            orderItems: validatedData.items.map(item => ({
                ...item,
                dish: dishMap.get(item.dishId) || { name: 'Unknown Dish' }
            })),
            items: validatedData.items.map(item => ({
                ...item,
                dishName: dishMap.get(item.dishId)?.name || 'Unknown Dish',
                dish: dishMap.get(item.dishId) || { name: 'Unknown Dish' }
            }))
        }

        console.log('Order created successfully')
        return NextResponse.json(transformedOrder, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Validation error:', error.errors)
            return NextResponse.json(
                { error: 'Invalid data', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Error creating order:', error)
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        )
    }
}
