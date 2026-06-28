// app/api/face-verify/route.ts (with Azure Face API)
import { NextRequest, NextResponse } from "next/server"
import { database, ref, get } from '@/lib/firebase'
import { auth } from '@/auth'
import axios from 'axios'

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

        const { faceImage, userId } = await request.json()
        const targetUserId = userId || session.user.id
        
        // Get stored face image from database
        const userRef = ref(database, `users/${targetUserId}/profile/faceImage`)
        const userSnapshot = await get(userRef)
        
        if (!userSnapshot.exists()) {
            return NextResponse.json({ 
                data: null, 
                message: "No face image registered",
                status: 404 
            }, { status: 404 })
        }

        const storedFaceImage = userSnapshot.val()
        
        // Use Azure Face API to verify
        const isMatch = await verifyWithAzureFace(faceImage, storedFaceImage)
        
        return NextResponse.json({ 
            data: { isMatch }, 
            message: isMatch ? "Face verified" : "Face does not match",
            status: 200 
        })
    } catch (error: any) {
        console.error('Face verification error:', error)
        return NextResponse.json({ 
            data: null,
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}

async function verifyWithAzureFace(image1: string, image2: string): Promise<boolean> {
    try {
        // Azure Face API endpoint
        const endpoint = process.env.AZURE_FACE_ENDPOINT
        const key = process.env.AZURE_FACE_KEY
        
        // Detect face in first image
        const detectResponse1 = await axios.post(
            `${endpoint}/face/v1.0/detect`,
            { url: image1 },
            { headers: { 'Ocp-Apim-Subscription-Key': key } }
        )
        
        const detectResponse2 = await axios.post(
            `${endpoint}/face/v1.0/detect`,
            { url: image2 },
            { headers: { 'Ocp-Apim-Subscription-Key': key } }
        )
        
        if (!detectResponse1.data.length || !detectResponse2.data.length) {
            return false
        }
        
        // Verify faces
        const verifyResponse = await axios.post(
            `${endpoint}/face/v1.0/verify`,
            {
                faceId1: detectResponse1.data[0].faceId,
                faceId2: detectResponse2.data[0].faceId
            },
            { headers: { 'Ocp-Apim-Subscription-Key': key } }
        )
        
        return verifyResponse.data.isIdentical
    } catch (error) {
        console.error('Azure Face API error:', error)
        return false
    }
}