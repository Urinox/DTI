// app/api/users/route.ts
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

        const usersRef = ref(database, 'users')
        const usersSnapshot = await get(usersRef)
        const users: any[] = []
        
        if (usersSnapshot.exists()) {
            const usersData = usersSnapshot.val()
            for (const [uid, userData] of Object.entries(usersData)) {
                const user = userData as any
                // Only return admin and sub users (limited data for security)
                if (user.role === 'admin' || user.role === 'Admin' || 
                    user.role === 'super_admin' ||
                    user.role === 'sub' || user.role === 'Sub' || 
                    user.role === 'provincial-director') {
                    users.push({
                        id: uid,
                        role: user.role,
                        username: user.username || '',
                        email: user.email || '',
                        profile: user.profile || {},
                        employeeId: user.employeeId || ''
                    })
                }
            }
        }
        
        console.log('📋 /api/users - Found users:', users.length)
        
        return NextResponse.json({ 
            data: users, 
            message: "Success",
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error fetching users:", error)
        return NextResponse.json({ 
            data: [], 
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}