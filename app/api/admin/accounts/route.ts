// app/api/admin/accounts/route.ts
import { NextRequest, NextResponse } from "next/server"
import { database, ref, get } from '@/lib/firebase'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        
        // ✅ Check if user is authenticated
        if (!session?.user?.id) {
            return NextResponse.json({ 
                data: null, 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        // Check if user is admin
        const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin'
        if (!isAdmin) {
            return NextResponse.json({ 
                data: null, 
                message: "Forbidden - Admin access required",
                status: 403 
            }, { status: 403 })
        }

        // ✅ Get all users from Realtime Database
        const usersRef = ref(database, 'users')
        const usersSnapshot = await get(usersRef)
        
        if (!usersSnapshot.exists()) {
            return NextResponse.json({ 
                data: [], 
                message: "No users found",
                status: 200 
            })
        }

        const usersData = usersSnapshot.val()
        const accounts = Object.keys(usersData).map(key => ({
            id: key,
            ...usersData[key]
        }))

        return NextResponse.json({ 
            data: accounts, 
            message: "Success",
            status: 200 
        })

    } catch (error: any) {
        console.error("❌ Error fetching accounts:", error)
        return NextResponse.json({ 
            data: null,
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}