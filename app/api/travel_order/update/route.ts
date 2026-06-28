// app/api/travel_order/update/route.ts
import { NextRequest, NextResponse } from "next/server"
import { database, ref, get, update } from '@/lib/firebase'
import { auth } from '@/auth'

export async function PUT(
    request: NextRequest
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ 
                data: null, 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        // Only Division Head, Provincial Director, Admin can approve/disapprove
        const allowedRoles = ['division-head', 'provincial-director', 'admin']
        if (!allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ 
                data: null, 
                message: "Only Division Heads, Provincial Directors, and Admins can approve/disapprove",
                status: 403 
            }, { status: 403 })
        }

        const { requestId, status } = await request.json()
        
        if (!requestId || !status) {
            return NextResponse.json({ 
                data: null,
                message: "Request ID and status are required",
                status: 400 
            }, { status: 400 })
        }

        // Find which user this request belongs to
        const usersRef = ref(database, 'users')
        const usersSnapshot = await get(usersRef)
        
        let foundUserId = null
        
        if (usersSnapshot.exists()) {
            const usersData = usersSnapshot.val()
            for (const [uid, userData] of Object.entries(usersData)) {
                const user = userData as any
                if (user.travel_orders && user.travel_orders[requestId]) {
                    foundUserId = uid
                    break
                }
            }
        }
        
        if (!foundUserId) {
            return NextResponse.json({ 
                data: null,
                message: "Travel order not found",
                status: 404 
            }, { status: 404 })
        }

        // Update the travel order
        const travelRef = ref(database, `users/${foundUserId}/travel_orders/${requestId}`)
        await update(travelRef, {
            status: status,
            reviewedBy: session.user.username || session.user.email,
            reviewedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })
        
        return NextResponse.json({ 
            data: { id: requestId },
            message: `Travel order ${status} successfully`,
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error updating travel order:", error)
        return NextResponse.json({ 
            data: null,
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}