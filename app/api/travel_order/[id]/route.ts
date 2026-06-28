// app/api/travel_order/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { database, ref, get, set, push } from '@/lib/firebase'
import { auth } from '@/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        
        console.log('🔍 GET Travel Orders - UserId:', id)
        
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ 
                data: [], 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        const userRole = session.user.role
        console.log('👤 User Role:', userRole)
        
        // ✅ Get ALL travel orders from ALL users
        if (userRole === 'provincial-director' || userRole === 'admin' || userRole === 'division-head' || userRole === 'division' || userRole === 'sub') {
            const usersRef = ref(database, 'users')
            const usersSnapshot = await get(usersRef)
            const allRecords: any[] = []
            
            if (usersSnapshot.exists()) {
                const usersData = usersSnapshot.val()
                console.log('📋 Found users:', Object.keys(usersData).length)
                
                for (const [uid, userData] of Object.entries(usersData)) {
                    const user = userData as any
                    console.log(`🔍 Checking user ${uid}:`, Object.keys(user))
                    
                    // Get user profile info
                    const profile = user.profile || {}
                    const office = profile.office || user.office || ''
                    const division = profile.division || user.division || ''
                    
                    // Check for travel_orders
                    if (user.travel_orders) {
                        const travelOrders = user.travel_orders
                        console.log(`📋 Found travel orders for user ${user.username || uid}:`, Object.keys(travelOrders).length)
                        
                        // Check if travel_orders has child nodes or is a single object
                        const keys = Object.keys(travelOrders)
                        
                        // If the keys are not timestamp-like or contain 'updatedAt', it might be a single object
                        if (keys.length === 1 && keys[0] === 'updatedAt') {
                            // This is a single travel order saved directly
                            allRecords.push({
                                id: 'single_order',
                                ...travelOrders,
                                userId: uid,
                                username: user.username || user.email || 'Unknown',
                                office: office,
                                division: division
                            })
                        } else {
                            // Multiple travel orders with unique keys
                            const userTravels = keys.map(key => ({
                                id: key,
                                ...travelOrders[key],
                                userId: uid,
                                username: user.username || user.email || 'Unknown',
                                office: office,
                                division: division
                            }))
                            allRecords.push(...userTravels)
                        }
                    } else {
                        console.log(`❌ No travel_orders for user ${uid}`)
                    }
                }
            }
            
            console.log(`📋 Total travel orders found: ${allRecords.length}`)
            
            return NextResponse.json({ 
                data: allRecords, 
                message: allRecords.length > 0 ? "Success" : "No travel orders found",
                status: 200 
            })
        }
        
        // ✅ COS-JO: Get their own travel orders
        const userRef = ref(database, `users/${id}`)
        const userSnapshot = await get(userRef)
        
        if (userSnapshot.exists()) {
            const userData = userSnapshot.val()
            const profile = userData.profile || {}
            const office = profile.office || userData.office || ''
            const division = profile.division || userData.division || ''
            
            if (userData.travel_orders) {
                const travelOrders = userData.travel_orders
                const keys = Object.keys(travelOrders)
                
                // Check if it's a single object or multiple
                if (keys.length === 1 && keys[0] === 'updatedAt') {
                    // Single travel order
                    const records = [{
                        id: 'single_order',
                        ...travelOrders,
                        office: office,
                        division: division
                    }]
                    return NextResponse.json({ 
                        data: records, 
                        message: "Success",
                        status: 200 
                    })
                } else {
                    // Multiple travel orders
                    const records = keys.map(key => ({
                        id: key,
                        ...travelOrders[key],
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
        }
        
        return NextResponse.json({ 
            data: [], 
            message: "No travel orders found",
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error fetching travel orders:", error)
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

        // Only COS-JO users can create travel orders
        const allowedRoles = ['cos-jo', 'cos']
        if (!allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ 
                data: null, 
                message: "Only COS-JO users can create travel orders",
                status: 403 
            }, { status: 403 })
        }

        const { startDate, endDate, purpose, expectedOutput, destination } = await request.json()
        
        if (!startDate || !endDate || !purpose || !expectedOutput || !destination) {
            return NextResponse.json({ 
                data: null,
                message: "All fields are required",
                status: 400 
            }, { status: 400 })
        }

        // ✅ Use push() to create a unique key for each travel order
        const userTravelRef = ref(database, `users/${id}/travel_orders`)
        const newTravelRef = push(userTravelRef)
        
        await set(newTravelRef, {
            startDate: startDate,
            endDate: endDate,
            purpose: purpose,
            expectedOutput: expectedOutput,
            destination: destination,
            status: 'Pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })
        
        return NextResponse.json({ 
            data: { id: newTravelRef.key },
            message: "Travel order created successfully",
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error creating travel order:", error)
        return NextResponse.json({ 
            data: null,
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}