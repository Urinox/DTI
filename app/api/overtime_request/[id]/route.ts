// app/api/overtime/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { database, ref, get, set, push } from '@/lib/firebase'
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
                data: [], 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        const userRole = session.user.role
        
        // ✅ Get ALL overtime requests from ALL users
        if (userRole === 'provincial-director' || userRole === 'admin' || userRole === 'division-head' || userRole === 'division' || userRole === 'sub') {
            const usersRef = ref(database, 'users')
            const usersSnapshot = await get(usersRef)
            const allRecords: any[] = []
            
            if (usersSnapshot.exists()) {
                const usersData = usersSnapshot.val()
                for (const [uid, userData] of Object.entries(usersData)) {
                    const user = userData as any
                    const profile = user.profile || {}
                    const office = profile.office || user.office || ''
                    const division = profile.division || user.division || ''
                    
                    if (user.overtimes) {
                        const userOvertimes = Object.keys(user.overtimes).map(key => ({
                            id: key,
                            ...user.overtimes[key],
                            userId: uid,
                            username: user.username || 'Unknown',
                            office: office,
                            division: division
                        }))
                        allRecords.push(...userOvertimes)
                    }
                }
            }
            
            return NextResponse.json({ 
                data: allRecords, 
                message: "Success",
                status: 200 
            })
        }
        
        // ✅ COS-JO: Get their own overtime requests
        const userRef = ref(database, `users/${id}`)
        const userSnapshot = await get(userRef)
        
        if (userSnapshot.exists()) {
            const userData = userSnapshot.val()
            const profile = userData.profile || {}
            const office = profile.office || userData.office || ''
            const division = profile.division || userData.division || ''
            
            if (userData.overtimes) {
                const overtimeData = userData.overtimes
                const records = Object.keys(overtimeData).map(key => ({
                    id: key,
                    ...overtimeData[key],
                    office: office,
                    division: division
                }))
                return NextResponse.json({ 
                    data: records, 
                    message: "Success",
                    status: 200 
                })
            }
        }
        
        return NextResponse.json({ 
            data: [], 
            message: "No overtime requests found",
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error fetching overtime requests:", error)
        return NextResponse.json({ 
            data: [], 
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}

export async function POST(
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

        const allowedRoles = ['cos-jo', 'cos']
        if (!allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ 
                data: null, 
                message: "Only COS-JO users can create overtime requests",
                status: 403 
            }, { status: 403 })
        }

        const { startDate, endDate, purpose, destination, hours } = await request.json()
        
        if (!startDate || !endDate || !purpose || !destination) {
            return NextResponse.json({ 
                data: null,
                message: "All fields are required",
                status: 400 
            }, { status: 400 })
        }

        const userOvertimeRef = ref(database, `users/${id}/overtimes`)
        const newOvertimeRef = push(userOvertimeRef)
        
        await set(newOvertimeRef, {
            startDate: startDate,
            endDate: endDate,
            purpose: purpose,
            destination: destination,
            hours: hours || '',
            status: 'Pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })
        
        return NextResponse.json({ 
            data: { id: newOvertimeRef.key },
            message: "Overtime request created successfully",
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error creating overtime request:", error)
        return NextResponse.json({ 
            data: null,
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}