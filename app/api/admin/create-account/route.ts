// app/api/admin/create-account/route.ts
import { NextRequest, NextResponse } from "next/server"
import { database, ref, set, get } from '@/lib/firebase'
import { auth } from '@/auth'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { app } from '@/lib/firebase'

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

        const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin'
        if (!isAdmin) {
            return NextResponse.json({ 
                data: null, 
                message: "Forbidden - Admin access required",
                status: 403 
            }, { status: 403 })
        }

        const { email, password, username, role, name, employeeId } = await request.json()
        
        if (!email || !password || !username) {
            return NextResponse.json({ 
                data: null, 
                message: "Email, password, and username are required",
                status: 400 
            }, { status: 400 })
        }

        if (password.length < 7) {
            return NextResponse.json({ 
                data: null, 
                message: "Password must be at least 7 characters",
                status: 400 
            }, { status: 400 })
        }

        // ✅ Check if username or email already exists
        const usersRef = ref(database, 'users')
        const usersSnapshot = await get(usersRef)
        
        if (usersSnapshot.exists()) {
            const usersData = usersSnapshot.val()
            for (const key of Object.keys(usersData)) {
                if (usersData[key].username === username) {
                    return NextResponse.json({ 
                        data: null, 
                        message: "Username already exists",
                        status: 400 
                    }, { status: 400 })
                }
                if (usersData[key].email === email) {
                    return NextResponse.json({ 
                        data: null, 
                        message: "Email already exists",
                        status: 400 
                    }, { status: 400 })
                }
            }
        }

        // ✅ Create user in Firebase Auth
        const firebaseAuth = getAuth(app)
        let firebaseUser
        
        try {
            const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
            firebaseUser = userCredential.user
        } catch (authError: any) {
            console.error('Firebase Auth error:', authError)
            return NextResponse.json({ 
                data: null, 
                message: authError.message || "Error creating user in Firebase Auth",
                status: 400 
            }, { status: 400 })
        }

        // ✅ Save user data to Realtime Database
        const userRef = ref(database, `users/${firebaseUser.uid}`)
        await set(userRef, {
            email: email,
            username: username,
            role: role || 'cos',
            employeeId: employeeId || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })

        // ✅ Create profile for the user
        const profileRef = ref(database, `users/${firebaseUser.uid}/profile`)
        await set(profileRef, {
            name: name || username,
            email: email,
            designation: '',
            division: '',
            office: ''
        })

        return NextResponse.json({ 
            data: { 
                uid: firebaseUser.uid,
                email: email,
                username: username,
                role: role || 'cos',
                name: name || username,
                employeeId: employeeId || ''
            }, 
            message: "Account created successfully",
            status: 200 
        })

    } catch (error: any) {
        console.error("❌ Error creating account:", error)
        return NextResponse.json({ 
            data: null,
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}