// app/api/admin/employees/route.ts
import { NextRequest, NextResponse } from "next/server"
import { database, ref, get } from '@/lib/firebase'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ 
                data: [], 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        // Only admin can access this
        if (session.user.role !== 'admin') {
            return NextResponse.json({ 
                data: [], 
                message: "Unauthorized - Admin only",
                status: 403 
            }, { status: 403 })
        }

        const usersRef = ref(database, 'users')
        const usersSnapshot = await get(usersRef)
        const employees: any[] = []
        
        if (usersSnapshot.exists()) {
            const usersData = usersSnapshot.val()
            for (const [uid, userData] of Object.entries(usersData)) {
                const user = userData as any
                // Get all users except admin (or include admin if needed)
                employees.push({
                    id: uid,
                    ...user
                })
            }
        }
        
        return NextResponse.json({ 
            data: employees, 
            message: "Success",
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error fetching employees:", error)
        return NextResponse.json({ 
            data: [], 
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}