// app/api/overtime_request/update/route.ts
import { NextRequest, NextResponse } from "next/server"
import { database, ref, get, update } from '@/lib/firebase'  // ✅ Add 'get' to imports
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
        
        console.log('📝 Updating overtime request:', { requestId, status })
        console.log('👤 Reviewed by:', session.user.username)
        
        if (!requestId || !status) {
            return NextResponse.json({ 
                data: null,
                message: "Request ID and status are required",
                status: 400 
            }, { status: 400 })
        }

        // Validate status
        if (!['Approved', 'Disapproved', 'Pending'].includes(status)) {
            return NextResponse.json({ 
                data: null,
                message: "Invalid status. Must be Approved, Disapproved, or Pending",
                status: 400 
            }, { status: 400 })
        }

        // First, find which user this request belongs to
        const usersRef = ref(database, 'users')
        const usersSnapshot = await get(usersRef)  // ✅ 'get' is now imported
        
        let foundUserId = null
        let foundRequest = null
        
        if (usersSnapshot.exists()) {
            const usersData = usersSnapshot.val()
            for (const [uid, userData] of Object.entries(usersData)) {
                const user = userData as any
                if (user.overtime_requests && user.overtime_requests[requestId]) {
                    foundUserId = uid
                    foundRequest = user.overtime_requests[requestId]
                    break
                }
            }
        }
        
        if (!foundUserId || !foundRequest) {
            console.log('❌ Request not found:', requestId)
            return NextResponse.json({ 
                data: null,
                message: "Request not found",
                status: 404 
            }, { status: 404 })
        }

        // Update the request
        const overtimeRef = ref(database, `users/${foundUserId}/overtime_requests/${requestId}`)
        await update(overtimeRef, {
            status: status,
            reviewedBy: session.user.username || session.user.email,
            reviewedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })
        
        console.log(`✅ Request ${requestId} ${status} by ${session.user.username}`)
        
        return NextResponse.json({ 
            data: { id: requestId },
            message: `Request ${status} successfully`,
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error updating overtime request:", error)
        return NextResponse.json({ 
            data: null,
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}