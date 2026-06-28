// app/api/payroll/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { database, ref, get } from '@/lib/firebase'
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
        
        // For COS-JO: Get their own payroll records
        if (userRole === 'cos-jo' || userRole === 'cos') {
            const payrollRef = ref(database, `users/${id}/payroll`)
            const payrollSnapshot = await get(payrollRef)
            
            if (payrollSnapshot.exists()) {
                const payrollData = payrollSnapshot.val()
                const records = Object.keys(payrollData).map(key => ({
                    id: key,
                    ...payrollData[key]
                }))
                return NextResponse.json({ 
                    data: records, 
                    message: "Success",
                    status: 200 
                })
            }
        }
        
        // For Admin/Provincial Director/Division Head: Get all payroll records
        if (userRole === 'admin' || userRole === 'provincial-director' || userRole === 'division-head' || userRole === 'division' || userRole === 'sub') {
            const usersRef = ref(database, 'users')
            const usersSnapshot = await get(usersRef)
            const allRecords: any[] = []
            
            if (usersSnapshot.exists()) {
                const usersData = usersSnapshot.val()
                for (const [uid, userData] of Object.entries(usersData)) {
                    const user = userData as any
                    if (user.payroll) {
                        const userPayroll = Object.keys(user.payroll).map(key => ({
                            id: key,
                            ...user.payroll[key],
                            employeeId: uid,
                            employeeName: user.username || user.email || 'Unknown'
                        }))
                        allRecords.push(...userPayroll)
                    }
                }
            }
            
            return NextResponse.json({ 
                data: allRecords, 
                message: "Success",
                status: 200 
            })
        }
        
        return NextResponse.json({ 
            data: [], 
            message: "No payroll records found",
            status: 200 
        })
        
    } catch (error: any) {
        console.error("❌ Error fetching payroll records:", error)
        return NextResponse.json({ 
            data: [], 
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}