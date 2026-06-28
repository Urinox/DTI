// app/api/face-register/route.ts
import { NextRequest, NextResponse } from "next/server"
import { database, ref, update } from '@/lib/firebase'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ 
                data: null, 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        const { faceImage } = await request.json()
        
        // Save face image to database
        const userRef = ref(database, `users/${session.user.id}/profile`)
        await update(userRef, {
            faceImage: faceImage,
            faceRegisteredAt: new Date().toISOString()
        })
        
        return NextResponse.json({ 
            data: null, 
            message: "Face registered successfully",
            status: 200 
        })
    } catch (error: any) {
        return NextResponse.json({ 
            data: null,
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}