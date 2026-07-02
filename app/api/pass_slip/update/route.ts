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

        // ✅ Check user role
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

        const { requestId, status, approvedBy, approvedByName, approvedByDesignation, reviewedBy, reviewedByName, reviewedByDesignation } = await request.json()
        console.log('📋 Update request - requestId:', requestId, 'status:', status)
        console.log('📋 Approved by:', { approvedBy, approvedByName, approvedByDesignation })
        console.log('📋 Reviewed by:', { reviewedBy, reviewedByName, reviewedByDesignation })
        
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
        
        // ✅ Build update object based on who is approving/reviewing
        const updateData: any = {
            status: status,
            updatedAt: new Date().toISOString()
        }
        
        // ✅ If Division Head is approving, set approvedBy fields
        if (isDivisionHead || approvedBy) {
            updateData.approvedBy = approvedBy || session.user.id
            updateData.approvedByName = approvedByName || session.user.profile?.name || session.user.username || 'Division Head'
            updateData.approvedByDesignation = approvedByDesignation || session.user.profile?.designation || 'Division Head'
            updateData.approvedAt = new Date().toISOString()
            console.log('✅ Setting approvedBy fields:', updateData.approvedByName, updateData.approvedByDesignation)
        }
        
        // ✅ If Provincial Director is reviewing, set reviewedBy fields
        if (isProvincialDirector || reviewedBy) {
            updateData.reviewedBy = reviewedBy || session.user.id
            updateData.reviewedByName = reviewedByName || session.user.profile?.name || session.user.username || 'Provincial Director'
            updateData.reviewedByDesignation = reviewedByDesignation || session.user.profile?.designation || 'Provincial Trade and Industry Officer'
            updateData.reviewedAt = new Date().toISOString()
            console.log('✅ Setting reviewedBy fields:', updateData.reviewedByName, updateData.reviewedByDesignation)
        }
        
        // ✅ Fallback: If neither specific role but admin, set both
        if (isAdmin && !isDivisionHead && !isProvincialDirector) {
            updateData.approvedBy = session.user.id
            updateData.approvedByName = session.user.profile?.name || session.user.username || 'Admin'
            updateData.approvedByDesignation = session.user.profile?.designation || 'Admin'
            updateData.approvedAt = new Date().toISOString()
            updateData.reviewedBy = session.user.id
            updateData.reviewedByName = session.user.profile?.name || session.user.username || 'Admin'
            updateData.reviewedByDesignation = session.user.profile?.designation || 'Admin'
            updateData.reviewedAt = new Date().toISOString()
        }

        await update(passSlipRef, updateData)
        
        console.log('✅ Pass slip updated successfully with data:', updateData)
        
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