// TEMPORARY ENDPOINT - Delete all orders
// Remove this file after use
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/api/auth-middleware'

export async function DELETE(request: NextRequest) {
    // Verify authentication
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
        return auth.response
    }

    try {
        const ordersRef = adminDb.collection('orders')
        const snapshot = await ordersRef.get()

        if (snapshot.empty) {
            return NextResponse.json({ message: 'No orders to delete', count: 0 })
        }

        let deletedCount = 0

        // Delete in batches of 500 (Firestore limit)
        const batchSize = 500
        const docs = snapshot.docs

        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = adminDb.batch()
            const chunk = docs.slice(i, i + batchSize)

            for (const doc of chunk) {
                // Delete history subcollection first
                const historySnapshot = await doc.ref.collection('history').get()
                historySnapshot.forEach(historyDoc => {
                    batch.delete(historyDoc.ref)
                })

                // Delete the order document
                batch.delete(doc.ref)
                deletedCount++
            }

            await batch.commit()
        }

        return NextResponse.json({
            message: `Successfully deleted ${deletedCount} orders`,
            count: deletedCount
        })
    } catch (error) {
        console.error('Error deleting all orders:', error)
        return NextResponse.json(
            { error: 'Failed to delete orders' },
            { status: 500 }
        )
    }
}
