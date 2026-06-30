// app/api/dtr/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { database, ref, get, set, push, update, remove } from '@/lib/firebase'
import { auth } from '@/auth'

// GET - Fetch DTR records for a user
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params
        
        console.log('🔍 GET DTR - UserId:', userId)
        
        if (!userId) {
            return NextResponse.json({ 
                data: null, 
                message: "User ID required",
                status: 400 
            }, { status: 400 })
        }
        
        // Verify authentication
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ 
                data: null, 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        // Get DTR records from Realtime Database
        const dtrRef = ref(database, `dtr/${userId}`)
        const dtrSnapshot = await get(dtrRef)
        
        if (!dtrSnapshot.exists()) {
            return NextResponse.json({ 
                data: [], 
                message: "No DTR records found",
                status: 200 
            })
        }
        
        const dtrData = dtrSnapshot.val()
        const records = Object.keys(dtrData).map(key => ({
            id: key,
            ...dtrData[key]
        }))
        
        return NextResponse.json({ 
            data: records, 
            message: "Success",
            status: 200 
        })
        
    } catch (error) {
        console.error("❌ Error fetching DTR:", error)
        return NextResponse.json({ 
            data: null, 
            message: "Server error",
            status: 500 
        }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params
        
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ 
                data: null, 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        const { date, session: sessionType, timeInAM, timeInPM, location, locationInAM, locationInPM, status } = await request.json()
        
        if (!date || !sessionType) {
            return NextResponse.json({ 
                data: null,
                message: "Date and session are required",
                status: 400 
            }, { status: 400 })
        }

        const dtrRef = ref(database, `dtr/${userId}`)
        const dtrSnapshot = await get(dtrRef)
        
        let existingRecordId = null
        let existingRecord = null
        
        if (dtrSnapshot.exists()) {
            const records = dtrSnapshot.val()
            for (const [key, record] of Object.entries(records)) {
                if ((record as any).date === date) {
                    existingRecordId = key
                    existingRecord = record
                    break
                }
            }
        }

        if (existingRecordId && existingRecord) {
            const recordRef = ref(database, `dtr/${userId}/${existingRecordId}`)
            const updates: any = { updatedAt: new Date().toISOString() }
            
            if (sessionType === 'morning') {
                // Only update time if provided and not empty
                if (timeInAM !== undefined && timeInAM !== null && timeInAM !== '') {
                    updates.timeInAM = timeInAM
                }
                if (locationInAM || location) {
                    updates.locationInAM = locationInAM || location || ''
                }
            } else {
                if (timeInPM !== undefined && timeInPM !== null && timeInPM !== '') {
                    updates.timeInPM = timeInPM
                }
                if (locationInPM || location) {
                    updates.locationInPM = locationInPM || location || ''
                }
            }
            
            // Update status if provided
            if (status !== undefined && status !== null) {
                updates.status = status
            }
            
            await update(recordRef, updates)
            return NextResponse.json({ 
                data: { id: existingRecordId },
                message: `Record updated successfully (${sessionType})`,
                status: 200 
            })
        } else {
            // Double-check to prevent race condition
            const dtrSnapshot2 = await get(dtrRef)
            if (dtrSnapshot2.exists()) {
                const records = dtrSnapshot2.val()
                for (const [key, record] of Object.entries(records)) {
                    if ((record as any).date === date) {
                        // Another request created it, update instead
                        const recordRef = ref(database, `dtr/${userId}/${key}`)
                        const updates: any = { updatedAt: new Date().toISOString() }
                        
                        if (sessionType === 'morning' && timeInAM) {
                            updates.timeInAM = timeInAM
                            updates.locationInAM = locationInAM || location || ''
                        } else if (sessionType !== 'morning' && timeInPM) {
                            updates.timeInPM = timeInPM
                            updates.locationInPM = locationInPM || location || ''
                        }
                        if (status) updates.status = status
                        
                        await update(recordRef, updates)
                        return NextResponse.json({ 
                            data: { id: key },
                            message: `Record updated successfully (${sessionType})`,
                            status: 200 
                        })
                    }
                }
            }
            
            // No record exists, create it
            const newRecordRef = push(ref(database, `dtr/${userId}`))
            const newRecord: any = {
                date: date,
                timeInAM: '',
                timeOutAM: '',
                timeInPM: '',
                timeOutPM: '',
                locationInAM: '',
                locationOutAM: '',
                locationInPM: '',
                locationOutPM: '',
                totalHours: '',
                status: status || 'Present',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
            
            // Only set time values if provided
            if (sessionType === 'morning' && timeInAM !== undefined && timeInAM !== null && timeInAM !== '') {
                newRecord.timeInAM = timeInAM
                newRecord.locationInAM = locationInAM || location || ''
            } else if (sessionType !== 'morning' && timeInPM !== undefined && timeInPM !== null && timeInPM !== '') {
                newRecord.timeInPM = timeInPM
                newRecord.locationInPM = locationInPM || location || ''
            }
            
            await set(newRecordRef, newRecord)
            return NextResponse.json({ 
                data: { id: newRecordRef.key },
                message: status === 'Leave' ? 'Leave record created successfully' : `Time in recorded successfully (${sessionType})`,
                status: 200 
            })
        }
        
    } catch (error) {
        console.error("❌ Error saving DTR:", error)
        return NextResponse.json({ 
            data: null,
            message: "Server error",
            status: 500 
        }, { status: 500 })
    }
}

// PUT - Update DTR record (Time Out)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params
        
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ 
                data: null, 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        const { date, session: sessionType, timeOutAM, timeOutPM, location, locationOutAM, locationOutPM } = await request.json()
        
        if (!date || !sessionType) {
            return NextResponse.json({ 
                data: null,
                message: "Date and session are required",
                status: 400 
            }, { status: 400 })
        }

        const dtrRef = ref(database, `dtr/${userId}`)
        const dtrSnapshot = await get(dtrRef)
        
        let recordId = null
        let recordData = null
        
        if (dtrSnapshot.exists()) {
            const records = dtrSnapshot.val()
            for (const [key, record] of Object.entries(records)) {
                if ((record as any).date === date) {
                    recordId = key
                    recordData = record
                    break
                }
            }
        }

        if (!recordId || !recordData) {
            return NextResponse.json({ 
                data: null,
                message: "No record found for today",
                status: 404 
            }, { status: 404 })
        }

        const recordRef = ref(database, `dtr/${userId}/${recordId}`)
        const updates: any = { updatedAt: new Date().toISOString() }
        
        if (sessionType === 'morning') {
            updates.timeOutAM = timeOutAM
            if (locationOutAM || location) {
                updates.locationOutAM = locationOutAM || location
            }
        } else {
            updates.timeOutPM = timeOutPM
            if (locationOutPM || location) {
                updates.locationOutPM = locationOutPM || location
            }
        }
        
        // Calculate total hours if both AM and PM are complete and have valid times
        const record = recordData as any
        const hasAMComplete = record.timeInAM && record.timeInAM !== '' && record.timeOutAM && record.timeOutAM !== ''
        const hasPMComplete = record.timeInPM && record.timeInPM !== '' && record.timeOutPM && record.timeOutPM !== ''
        
        if (hasAMComplete && hasPMComplete) {
            // Calculate total hours
            const amIn = record.timeInAM.split(':')
            const amOut = record.timeOutAM.split(':')
            const pmIn = record.timeInPM.split(':')
            const pmOut = record.timeOutPM.split(':')
            
            const amMinutes = (parseInt(amOut[0]) * 60 + parseInt(amOut[1])) - (parseInt(amIn[0]) * 60 + parseInt(amIn[1]))
            const pmMinutes = (parseInt(pmOut[0]) * 60 + parseInt(pmOut[1])) - (parseInt(pmIn[0]) * 60 + parseInt(pmIn[1]))
            const totalMinutes = amMinutes + pmMinutes
            const hours = Math.floor(totalMinutes / 60)
            const minutes = totalMinutes % 60
            updates.totalHours = `${hours}h ${minutes}m`
            updates.status = 'Complete'
        } else if (record.status === 'Leave') {
            // Keep status as Leave if it was set
            // Don't change it
        }

        await update(recordRef, updates)
        
        return NextResponse.json({ 
            data: { id: recordId },
            message: `Time out recorded successfully (${sessionType})`,
            status: 200 
        })
        
    } catch (error) {
        console.error("❌ Error updating DTR:", error)
        return NextResponse.json({ 
            data: null,
            message: "Server error",
            status: 500 
        }, { status: 500 })
    }
}

// DELETE - Remove a DTR record
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params
        
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ 
                data: null, 
                message: "Unauthorized",
                status: 401 
            }, { status: 401 })
        }

        const url = new URL(request.url)
        const recordId = url.searchParams.get('recordId')
        
        if (!recordId) {
            return NextResponse.json({ 
                data: null,
                message: "Record ID required",
                status: 400 
            }, { status: 400 })
        }

        // Verify the record exists and belongs to the user
        const recordRef = ref(database, `dtr/${userId}/${recordId}`)
        const recordSnapshot = await get(recordRef)
        
        if (!recordSnapshot.exists()) {
            return NextResponse.json({ 
                data: null,
                message: "Record not found",
                status: 404 
            }, { status: 404 })
        }

        // Delete the record
        await remove(recordRef)
        
        return NextResponse.json({ 
            data: null,
            message: "Record deleted successfully",
            status: 200 
        })
        
    } catch (error) {
        console.error("❌ Error deleting DTR:", error)
        return NextResponse.json({ 
            data: null,
            message: "Server error",
            status: 500 
        }, { status: 500 })
    }
}