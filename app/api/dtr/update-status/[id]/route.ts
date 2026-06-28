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
        
        if (!session?.user?.id || id !== session.user.id) {
            return NextResponse.json({ 
                data: null, 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        const { date, status } = await request.json()
        
        if (!date || !status) {
            return NextResponse.json({ 
                data: null, 
                message: "Date and status are required",
                status: 400 
            }, { status: 400 })
        }

        // ✅ Use the same path as the GET route: dtr/${id}
        const userDtrRef = ref(database, `dtr/${id}`)
        const dtrSnapshot = await get(userDtrRef)
        
        if (!dtrSnapshot.exists()) {
            return NextResponse.json({ 
                data: null, 
                message: "No DTR records found",
                status: 404 
            }, { status: 404 })
        }

        const dtrData = dtrSnapshot.val()
        let recordFound = false
        
        for (const [key, value] of Object.entries(dtrData)) {
            const record = value as any
            if (record.date === date) {
                const recordRef = ref(database, `dtr/${id}/${key}`)
                await update(recordRef, {
                    status: status,
                    updatedAt: new Date().toISOString()
                })
                recordFound = true
                break
            }
        }
        
        if (!recordFound) {
            return NextResponse.json({ 
                data: null, 
                message: "Record not found for the given date",
                status: 404 
            }, { status: 404 })
        }
        
        return NextResponse.json({ 
            data: null, 
            message: "Status updated successfully",
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error updating DTR status:", error)
        return NextResponse.json({ 
            data: null,
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}