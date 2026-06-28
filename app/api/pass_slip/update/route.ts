// app/api/pass_slip/update/route.ts
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

        // ✅ Check for both 'division-head' and 'division' roles
        const userRole = session.user.role
        const isDivisionHead = userRole === 'division-head' || userRole === 'division'
        const isProvincialDirector = userRole === 'provincial-director' || userRole === 'sub'
        const isAdmin = userRole === 'admin'
        
        console.log('👤 Update route - User Role:', userRole)
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

        const usersRef = ref(database, 'users')
        const usersSnapshot = await get(usersRef)
        
        let foundUserId = null
        
        if (usersSnapshot.exists()) {
            const usersData = usersSnapshot.val()
            for (const [uid, userData] of Object.entries(usersData)) {
                const user = userData as any
                if (user.pass_slips && user.pass_slips[requestId]) {
                    foundUserId = uid
                    break
                }
            }
        }
        
        if (!foundUserId) {
            console.log('❌ Pass slip not found for ID:', requestId)
            return NextResponse.json({ 
                data: null,
                message: "Pass slip not found",
                status: 404 
            }, { status: 404 })
        }

        console.log('✅ Found pass slip for user:', foundUserId)

        const passSlipRef = ref(database, `users/${foundUserId}/pass_slips/${requestId}`)
        await update(passSlipRef, {
            status: status,
            reviewedBy: session.user.username || session.user.email,
            reviewedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })
        
        console.log('✅ Pass slip updated successfully')
        
        return NextResponse.json({ 
            data: { id: requestId },
            message: `Pass slip ${status} successfully`,
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error updating pass slip:", error)
        return NextResponse.json({ 
            data: null,
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}