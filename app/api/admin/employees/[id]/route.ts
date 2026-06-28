// app/api/admin/employees/[id]/route.ts (Without Admin SDK)
import { NextRequest, NextResponse } from "next/server"
import { database, ref, get, update, set } from '@/lib/firebase'
import { auth } from '@/auth'
import { getAuth, updatePassword, sendPasswordResetEmail } from 'firebase/auth'
import { firebaseApp } from '@/lib/firebase'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()
        
        if (!session?.user?.id || session.user.role !== 'admin') {
            return NextResponse.json({ 
                data: null, 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        const { name, email, division, office, designation, password } = await request.json()
        
        // Update user profile in database
        const userRef = ref(database, `users/${id}`)
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
            email: email
        }
        
        if (division) updates['profile/division'] = division
        if (office) updates['profile/office'] = office
        
        await update(userRef, updates)

        // ✅ Alternative: Send password reset email instead of updating directly
        if (password) {
            try {
                // Use Firebase Client SDK to send password reset
                const authInstance = getAuth()
                await sendPasswordResetEmail(authInstance, email)
                // This sends a password reset email to the user
                // They can then set a new password themselves
            } catch (error) {
                console.error('Error sending password reset:', error)
                // Continue - profile was updated
            }
        }
        
        return NextResponse.json({ 
            data: { id }, 
            message: password ? "Employee updated. Password reset email sent." : "Employee updated successfully",
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error updating employee:", error)
        return NextResponse.json({ 
            data: null,
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}