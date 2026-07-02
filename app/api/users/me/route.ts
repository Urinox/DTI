// app/api/user/me/route.ts
import { NextRequest, NextResponse } from "next/server"
import { database, ref, get } from '@/lib/firebase'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ 
                data: null, 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        const userRef = ref(database, `users/${session.user.id}`)
        const userSnapshot = await get(userRef)
        
        if (!userSnapshot.exists()) {
            return NextResponse.json({ 
                data: null, 
                message: "User not found",
                status: 404 
            }, { status: 404 })
        }

        const userData = userSnapshot.val()
        
        // Return only necessary data
        return NextResponse.json({ 
            data: {
                id: session.user.id,
                employeeId: userData.employeeId || '',
                profile: userData.profile || {},
                username: userData.username || '',
                email: userData.email || '',
                role: userData.role || ''
            },
            message: "Success",
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error fetching user data:", error)
        return NextResponse.json({ 
            data: null, 
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}