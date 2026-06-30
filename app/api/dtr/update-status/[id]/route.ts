// app/api/dtr/update-status/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { database, ref, get, update } from '@/lib/firebase'
import { auth } from '@/auth'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()
        
        // ✅ Check if user is authenticated
        if (!session?.user?.id) {
            return NextResponse.json({ 
                data: null, 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        // ✅ Allow admin to update any user's DTR
        // Only check if the user is an admin, or if they're updating their own record
        const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin'
        const isOwnRecord = session.user.id === id
        
        if (!isAdmin && !isOwnRecord) {
            return NextResponse.json({ 
                data: null, 
                message: "Unauthorized - You can only update your own DTR",
                status: 403 
            }, { status: 403 })
        }

        const { date, status } = await request.json()
        
        if (!date) {
            return NextResponse.json({ 
                data: null, 
                message: "Date is required",
                status: 400 
            }, { status: 400 })
        }

        // ✅ Use the path: dtr/${id}
        const userDtrRef = ref(database, `dtr/${id}`)
        const dtrSnapshot = await get(userDtrRef)
        
        if (!dtrSnapshot.exists()) {
            return NextResponse.json({ 
                data: null, 
                message: "No DTR records found for this user",
                status: 404 
            }, { status: 404 })
        }

        const dtrData = dtrSnapshot.val()
        let recordFound = false
        let recordKey = null
        
        for (const [key, value] of Object.entries(dtrData)) {
            const record = value as any
            if (record.date === date) {
                recordKey = key
                recordFound = true
                break
            }
        }
        
        if (!recordFound) {
            return NextResponse.json({ 
                data: null, 
                message: `Record not found for date: ${date}`,
                status: 404 
            }, { status: 404 })
        }

        // ✅ Update the status
        const recordRef = ref(database, `dtr/${id}/${recordKey}`)
        const updates: any = {
            updatedAt: new Date().toISOString()
        }
        
        if (status !== undefined) {
            updates.status = status
        }
        
        await update(recordRef, updates)
        
        return NextResponse.json({ 
            data: { 
                date: date,
                status: status,
                updatedAt: updates.updatedAt
            }, 
            message: "DTR updated successfully",
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error updating DTR:", error)
        return NextResponse.json({ 
            data: null,
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}