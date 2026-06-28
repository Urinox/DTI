// app/api/admin/employees/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { database, ref, get, update, set } from '@/lib/firebase'
import { auth } from '@/auth'
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'
import { app } from '@/lib/firebase'  // ✅ Import app instead of firebaseApp

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

        // ✅ Include username and employeeId
        const { name, email, division, office, designation, password, username, employeeId } = await request.json()
        
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
            email: email,
            updatedAt: new Date().toISOString()
        }
        
        // ✅ Update username if provided
        if (username !== undefined) {
            updates.username = username
        }
        
        // ✅ Update employeeId if provided
        if (employeeId !== undefined) {
            updates.employeeId = employeeId
        }
        
        if (division !== undefined) {
            updates['profile/division'] = division
        }
        
        if (office !== undefined) {
            updates['profile/office'] = office
        }
        
        await update(userRef, updates)

        // Send password reset email if password is provided
        if (password) {
            try {
                const authInstance = getAuth(app)  // ✅ Use app from @/lib/firebase
                await sendPasswordResetEmail(authInstance, email)
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

export async function DELETE(
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

        // Don't allow deleting yourself
        if (id === session.user.id) {
            return NextResponse.json({ 
                data: null, 
                message: "Cannot delete your own account",
                status: 400 
            }, { status: 400 })
        }

        // Delete user data from database
        const userRef = ref(database, `users/${id}`)
        await set(userRef, null)
        
        return NextResponse.json({ 
            data: { id }, 
            message: "Employee deleted successfully",
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error deleting employee:", error)
        return NextResponse.json({ 
            data: null,
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}