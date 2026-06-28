// app/api/profile/upload-image/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { database, ref, update } from '@/lib/firebase'
import { auth } from '@/auth'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params
        
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        const { image } = await request.json()
        
        if (!image) {
            return NextResponse.json({ 
                message: "Image is required",
                status: 400 
            }, { status: 400 })
        }

        // Save image to Firebase Realtime Database
        const userRef = ref(database, `users/${userId}`)
        await update(userRef, {
            profileImage: image
        })
        
        return NextResponse.json({ 
            message: "Image uploaded successfully",
            status: 200 
        })
        
    } catch (error) {
        console.error("Error uploading image:", error)
        return NextResponse.json({ 
            message: "Server error",
            status: 500 
        }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params
        
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        // Remove image from Firebase Realtime Database
        const userRef = ref(database, `users/${userId}`)
        await update(userRef, {
            profileImage: null
        })
        
        return NextResponse.json({ 
            message: "Image removed successfully",
            status: 200 
        })
        
    } catch (error) {
        console.error("Error removing image:", error)
        return NextResponse.json({ 
            message: "Server error",
            status: 500 
        }, { status: 500 })
    }
}