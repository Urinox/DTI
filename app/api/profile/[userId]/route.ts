// app/api/profile/[userid]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { database, ref, get, update } from '@/lib/firebase'
import { auth } from '@/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userid: string }> }
) {
    try {
        const { userid } = await params
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ 
                data: null, 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        // ✅ ALWAYS use the session user ID, ignore the URL parameter
        const userId = session.user.id
        
        console.log('🔍 Fetching profile for user ID:', userId)
        console.log('📌 URL parameter was:', userid)
        
        const userRef = ref(database, `users/${userId}`)
        const userSnapshot = await get(userRef)
        
        if (!userSnapshot.exists()) {
            return NextResponse.json({ 
                data: null, 
                message: "User not found",
                status: 404 
            }, { status: 404 })
        }

        const userData = userSnapshot.val()
        
        return NextResponse.json({ 
            data: {
                id: userId,
                ...userData
            }, 
            message: "Success",
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error fetching profile:", error)
        return NextResponse.json({ 
            data: null, 
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ userid: string }> }
) {
    try {
        const { userid } = await params
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ 
                data: null, 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        // ✅ ALWAYS use the session user ID, ignore the URL parameter
        const userId = session.user.id
        
        console.log('🔍 Updating profile for user ID:', userId)
        console.log('📌 URL parameter was:', userid)

        const { name, email, division, office, designation, username } = await request.json()
        
        if (!name || !email || !designation) {
            return NextResponse.json({ 
                data: null, 
                message: "Name, email, and designation are required",
                status: 400 
            }, { status: 400 })
        }

        const userRef = ref(database, `users/${userId}`)
        const userSnapshot = await get(userRef)
        
        if (!userSnapshot.exists()) {
            return NextResponse.json({ 
                data: null, 
                message: "User not found",
                status: 404 
            }, { status: 404 })
        }

        const updates: any = {
            'profile/name': name,
            'profile/designation': designation,
            email: email,
            updatedAt: new Date().toISOString()
        }
        
        // ✅ Update username if provided
        if (username !== undefined) {
            updates.username = username
        }
        
        if (division !== undefined) {
            updates['profile/division'] = division
        }
        
        if (office !== undefined) {
            updates['profile/office'] = office
        }
        
        await update(userRef, updates)
        
        return NextResponse.json({ 
            data: { id: userId }, 
            message: "Profile updated successfully",
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error updating profile:", error)
        return NextResponse.json({ 
            data: null, 
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}