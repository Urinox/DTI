// app/api/pass_slip/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { database, ref, get, set, push, update } from '@/lib/firebase'
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
        console.log('👤 Pass Slip GET - User Role:', userRole)
        
        if (userRole === 'provincial-director' || userRole === 'admin' || userRole === 'division-head' || userRole === 'division' || userRole === 'sub') {
            const usersRef = ref(database, 'users')
            const usersSnapshot = await get(usersRef)
            const allRecords: any[] = []
            
            if (usersSnapshot.exists()) {
                const usersData = usersSnapshot.val()
                console.log('📋 Found users:', Object.keys(usersData).length)
                
                for (const [uid, userData] of Object.entries(usersData)) {
                    const user = userData as any
                    const profile = user.profile || {}
                    const office = profile.office || user.office || ''
                    const division = profile.division || user.division || ''
                    
                    if (user.pass_slips) {
                        console.log(`📋 Found pass slips for user ${user.username || uid}:`, Object.keys(user.pass_slips).length)
                        
                        const userPassSlips = Object.keys(user.pass_slips).map(key => ({
                            id: key,
                            ...user.pass_slips[key],
                            userId: uid,
                            // ✅ Add name, employeeId, username, office, division
                            name: profile.name || user.username || 'N/A',
                            employeeId: user.employeeId || '',
                            username: user.username || 'Unknown',
                            office: office,
                            division: division
                        }))
                        allRecords.push(...userPassSlips)
                    }
                }
            }
            
            console.log(`📋 Total pass slips found: ${allRecords.length}`)
            
            return NextResponse.json({ 
                data: allRecords, 
                message: "Success",
                status: 200 
            })
        }
        
        // COS-JO: Get their own pass slips
        const userPassSlipRef = ref(database, `users/${id}/pass_slips`)
        const passSlipSnapshot = await get(userPassSlipRef)
        
        if (passSlipSnapshot.exists()) {
            const passSlipData = passSlipSnapshot.val()
            // ✅ Also get the user's own data for COS-JO view
            const userRef = ref(database, `users/${id}`)
            const userSnapshot = await get(userRef)
            let userData = {}
            let profile = {}
            if (userSnapshot.exists()) {
                userData = userSnapshot.val()
                profile = (userData as any).profile || {}
            }
            
            const records = Object.keys(passSlipData).map(key => ({
                id: key,
                ...passSlipData[key],
                // ✅ Add the user's own info for COS-JO view
                userId: id,
                name: (profile as any).name || (userData as any).username || 'N/A',
                employeeId: (userData as any).employeeId || '',
                username: (userData as any).username || 'Unknown',
                office: (profile as any).office || (profile as any).division || '',
                division: (profile as any).division || ''
            }))
            return NextResponse.json({ 
                data: records, 
                message: "Success",
                status: 200 
            })
        }
        
        return NextResponse.json({ 
            data: [], 
            message: "No pass slips found",
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error fetching pass slips:", error)
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
                message: "Only COS-JO users can create pass slips",
                status: 403 
            }, { status: 403 })
        }

        const { startDate, endDate, type, purpose, destination } = await request.json()
        
        if (!startDate || !endDate || !purpose || !destination) {
            return NextResponse.json({ 
                data: null,
                message: "All fields are required",
                status: 400 
            }, { status: 400 })
        }

        const userPassSlipRef = ref(database, `users/${id}/pass_slips`)
        const newPassSlipRef = push(userPassSlipRef)
        
        await set(newPassSlipRef, {
            startDate: startDate,
            endDate: endDate,
            type: type || 'Official',
            purpose: purpose,
            destination: destination,
            status: 'Pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })
        
        return NextResponse.json({ 
            data: { id: newPassSlipRef.key },
            message: "Pass slip created successfully",
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error creating pass slip:", error)
        return NextResponse.json({ 
            data: null,
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}