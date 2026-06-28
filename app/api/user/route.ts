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

        // ✅ Get the role from session
        const userRole = session.user.role
        console.log('👤 Update route - User Role:', userRole)
        
        // ✅ Check for ALL possible role variations
        const isDivisionHead = userRole === 'division-head' || userRole === 'division'
        const isProvincialDirector = userRole === 'provincial-director' || userRole === 'sub'
        const isAdmin = userRole === 'admin'
        
        console.log('🔍 Role checks - isDivisionHead:', isDivisionHead, 'isProvincialDirector:', isProvincialDirector, 'isAdmin:', isAdmin)
        
        // Allow Division Head, Provincial Director, Admin to approve/disapprove
        if (!isDivisionHead && !isProvincialDirector && !isAdmin) {
            console.log('❌ Unauthorized role:', userRole)
            return NextResponse.json({ 
                data: null, 
                message: `Only Division Heads, Provincial Directors, and Admins can approve/disapprove. Your role: ${userRole}`,
                status: 403 
            }, { status: 403 })
        }

        const { requestId, status } = await request.json()
        console.log('📋 Update request - requestId:', requestId, 'status:', status)
        
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
        let foundRequest = null
        
        if (usersSnapshot.exists()) {
            const usersData = usersSnapshot.val()
            for (const [uid, userData] of Object.entries(usersData)) {
                const user = userData as any
                if (user.travel_orders) {
                    // Check if the request exists in this user's travel_orders
                    if (user.travel_orders[requestId]) {
                        foundUserId = uid
                        foundRequest = user.travel_orders[requestId]
                        break
                    }
                    
                    // Also check if it might be a single object directly under travel_orders
                    if (user.travel_orders.updatedAt) {
                        // This is a single travel order object
                        foundUserId = uid
                        foundRequest = user.travel_orders
                        break
                    }
                }
            }
        }
        
        if (!foundUserId || !foundRequest) {
            console.log('❌ Travel order not found for ID:', requestId)
            return NextResponse.json({ 
                data: null,
                message: "Travel order not found",
                status: 404 
            }, { status: 404 })
        }

        console.log('✅ Found travel order for user:', foundUserId)

        // Update the travel order
        const travelRef = ref(database, `users/${foundUserId}/travel_orders/${requestId}`)
        
        // If it's a single object, we need to update it differently
        if (foundRequest.updatedAt && !foundRequest.startDate) {
            // This is a single object, update the whole thing
            await update(travelRef, {
                status: status,
                reviewedBy: session.user.username || session.user.email,
                reviewedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
        } else {
            // Normal update
            await update(travelRef, {
                status: status,
                reviewedBy: session.user.username || session.user.email,
                reviewedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
        }
        
        console.log('✅ Travel order updated successfully')
        
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