// app/api/calendar/[id]/route.ts
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

        const url = new URL(request.url)
        const year = url.searchParams.get('year')
        const month = url.searchParams.get('month')

        const calendarRef = ref(database, `users/${id}/calendar`)
        const calendarSnapshot = await get(calendarRef)
        const events: any[] = []

        if (calendarSnapshot.exists()) {
            const calendarData = calendarSnapshot.val()
            for (const [key, value] of Object.entries(calendarData)) {
                const event = value as any
                if (year && month) {
                    const eventDate = new Date(event.date)
                    if (eventDate.getFullYear() === parseInt(year) && 
                        eventDate.getMonth() + 1 === parseInt(month)) {
                        events.push({
                            id: key,
                            ...event
                        })
                    }
                } else {
                    events.push({
                        id: key,
                        ...event
                    })
                }
            }
        }

        return NextResponse.json({ 
            data: events, 
            message: "Success",
            status: 200 
        })
    } catch (error: any) {
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

        const { date, title, description } = await request.json()
        
        if (!date || !title) {
            return NextResponse.json({ 
                data: null, 
                message: "Date and title are required",
                status: 400 
            }, { status: 400 })
        }

        const calendarRef = ref(database, `users/${id}/calendar`)
        const newEventRef = push(calendarRef)
        
        await set(newEventRef, {
            date: date,
            title: title,
            description: description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })

        return NextResponse.json({ 
            data: { id: newEventRef.key }, 
            message: "Event saved successfully",
            status: 200 
        })
    } catch (error: any) {
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

        const url = new URL(request.url)
        const date = url.searchParams.get('date')

        if (!date) {
            return NextResponse.json({ 
                data: null, 
                message: "Date is required",
                status: 400 
            }, { status: 400 })
        }

        const calendarRef = ref(database, `users/${id}/calendar`)
        const calendarSnapshot = await get(calendarRef)

        if (calendarSnapshot.exists()) {
            const calendarData = calendarSnapshot.val()
            for (const [key, value] of Object.entries(calendarData)) {
                const event = value as any
                if (event.date === date) {
                    const eventRef = ref(database, `users/${id}/calendar/${key}`)
                    await set(eventRef, null)
                    break
                }
            }
        }

        return NextResponse.json({ 
            data: null, 
            message: "Event deleted successfully",
            status: 200 
        })
    } catch (error: any) {
        return NextResponse.json({ 
            data: null, 
            message: "Server error: " + error.message,
            status: 500 
        }, { status: 500 })
    }
}