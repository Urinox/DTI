// app/api/admin/accounts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { database, ref, get, update, remove } from '@/lib/firebase'
import { auth } from '@/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ 
                data: null, 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin'
        if (!isAdmin) {
            return NextResponse.json({ 
                data: null, 
                message: "Forbidden - Admin access required",
                status: 403 
            }, { status: 403 })
        }

        const userRef = ref(database, `users/${id}`)
        const userSnapshot = await get(userRef)
        
        if (!userSnapshot.exists()) {
            return NextResponse.json({ 
                data: null, 
                message: "User not found",
                status: 404 
            }, { status: 404 })
        }

        const userData = userSnapshot.val()
        const account = {
            id: id,
            ...userData
        }

        return NextResponse.json({ 
            data: account, 
            message: "Success",
            status: 200 
        })

    } catch (error: any) {
        console.error("❌ Error fetching account:", error)
        return NextResponse.json({ 
            data: null,
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()
        
        if (!session?.user?.id) {
            return NextResponse.json({ 
                data: null, 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin'
        if (!isAdmin) {
            return NextResponse.json({ 
                data: null, 
                message: "Forbidden - Admin access required",
                status: 403 
            }, { status: 403 })
        }

        const { name, email, username, role, division, designation, office, employeeId } = await request.json()
        
        if (!name || !email || !username) {
            return NextResponse.json({ 
                data: null, 
                message: "Name, email, and username are required",
                status: 400 
            }, { status: 400 })
        }

        const userRef = ref(database, `users/${id}`)
        const userSnapshot = await get(userRef)
        
        if (!userSnapshot.exists()) {
            return NextResponse.json({ 
                data: null, 
                message: "User not found",
                status: 404 
            }, { status: 404 })
        }

        // Update user data in Realtime Database
        const updates: any = {
            username: username,
            email: email,
            role: role || 'cos',
            employeeId: employeeId || '',
            updatedAt: new Date().toISOString()
        }

        // Update profile
        const profileUpdates: any = {
            name: name,
            email: email,
            division: division || '',
            designation: designation || '',
            office: office || ''
        }

        // Update user node
        await update(userRef, updates)
        
        // Update profile node
        const profileRef = ref(database, `users/${id}/profile`)
        await update(profileRef, profileUpdates)

        return NextResponse.json({ 
            data: { id: id }, 
            message: "Account updated successfully",
            status: 200 
        })

    } catch (error: any) {
        console.error("❌ Error updating account:", error)
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
        
        if (!session?.user?.id) {
            return NextResponse.json({ 
                data: null, 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin'
        if (!isAdmin) {
            return NextResponse.json({ 
                data: null, 
                message: "Forbidden - Admin access required",
                status: 403 
            }, { status: 403 })
        }

        if (id === session.user.id) {
            return NextResponse.json({ 
                data: null, 
                message: "You cannot delete your own account",
                status: 400 
            }, { status: 400 })
        }

        const userRef = ref(database, `users/${id}`)
        const userSnapshot = await get(userRef)
        
        if (!userSnapshot.exists()) {
            return NextResponse.json({ 
                data: null, 
                message: "User not found",
                status: 404 
            }, { status: 404 })
        }

        const userData = userSnapshot.val()
        
        // Prevent deleting admin accounts
        if (userData.role === 'admin' || userData.role === 'super_admin') {
            return NextResponse.json({ 
                data: null, 
                message: "Cannot delete admin accounts",
                status: 400 
            }, { status: 400 })
        }

        // ✅ Instead of deleting, set a disabled flag
        await update(userRef, {
            disabled: true,
            disabledAt: new Date().toISOString(),
            disabledBy: session.user.id,
            updatedAt: new Date().toISOString()
        })

        return NextResponse.json({ 
            data: { id: id }, 
            message: "Account disabled successfully",
            status: 200 
        })

    } catch (error: any) {
        console.error("❌ Error disabling account:", error)
        return NextResponse.json({ 
            data: null,
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}