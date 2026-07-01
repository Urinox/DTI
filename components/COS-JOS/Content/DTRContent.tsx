// components/COS-JOS/Content/DTRContent.tsx
import Image from "next/image"
import ContentHeader from "@/components/ContentHeader"
import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useSession } from "next-auth/react"

interface DTRRecord {
    id: string
    date: string
    timeInAM: string
    timeOutAM: string
    timeInPM: string
    timeOutPM: string
    totalHours: string
    status: string
    leaveStatus?: string
    locationInAM?: string
    locationOutAM?: string
    locationInPM?: string
    locationOutPM?: string
    leaveDetails?: any[]
}

interface LeaveRequest {
    id: string
    startDate: string
    endDate: string
    type: string
    status: string
    purpose: string
    destination: string
}

interface OvertimeRequest {
    id: string
    startDate: string
    endDate: string
    hours: string
    status: string
    purpose: string
    destination: string
}

interface TravelOrderRequest {
    id: string
    startDate: string
    endDate: string
    purpose: string
    destination: string
    status: string
    expectedOutput: string
}

export default function DTRContent({username, userId}: {username: string, userId?: string}) {
    const { data: session } = useSession()
    const [currentTime, setCurrentTime] = useState(new Date())
    const [timeInAM, setTimeInAM] = useState<string | null>(null)
    const [timeOutAM, setTimeOutAM] = useState<string | null>(null)
    const [timeInPM, setTimeInPM] = useState<string | null>(null)
    const [timeOutPM, setTimeOutPM] = useState<string | null>(null)
    const [locationInAM, setLocationInAM] = useState<string | null>(null)
    const [locationOutAM, setLocationOutAM] = useState<string | null>(null)
    const [locationInPM, setLocationInPM] = useState<string | null>(null)
    const [locationOutPM, setLocationOutPM] = useState<string | null>(null)
    const [isTimeInAM, setIsTimeInAM] = useState(false)
    const [isTimeOutAM, setIsTimeOutAM] = useState(false)
    const [isTimeInPM, setIsTimeInPM] = useState(false)
    const [isTimeOutPM, setIsTimeOutPM] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [dtrRecords, setDtrRecords] = useState<DTRRecord[]>([])
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
    const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([])
    const [travelOrderRequests, setTravelOrderRequests] = useState<TravelOrderRequest[]>([])
    const [selectedMonth, setSelectedMonth] = useState('')
    const [editingRecord, setEditingRecord] = useState<string | null>(null)
    const [editingStatus, setEditingStatus] = useState<string>('')
    const [stats, setStats] = useState({
        tardiness: '0',
        undertime: '0',
        overtime: '0',
        sickLeave: '0',
        vacationLeave: '0',
        personalCalamity: '0',
        travelOrder: '0'
    })
    const [hasTodayRecord, setHasTodayRecord] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const [isGettingLocation, setIsGettingLocation] = useState(false)
    const isLoadingRef = useRef(false)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        const now = new Date()
        const month = now.toISOString().slice(0, 7)
        setSelectedMonth(month)
        loadData(month)
    }, [])

    useEffect(() => {
        if (session?.user?.id) {
            checkTodayRecord()
        }
    }, [session])

    // Focus input when editing starts
    useEffect(() => {
        if (editingRecord && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [editingRecord])

    // ✅ Get location with fallback (silently fails, doesn't block time-in/out)
    async function getCurrentLocation(): Promise<string> {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve('')
                return
            }

            const timeoutId = setTimeout(() => {
                resolve('')
            }, 5000)

            setIsGettingLocation(true)

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    clearTimeout(timeoutId)
                    setIsGettingLocation(false)
                    const { latitude, longitude } = position.coords
                    
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
                        .then(response => response.json())
                        .then(data => {
                            if (data && data.display_name) {
                                const address = data.display_name.split(',').slice(0, 3).join(',')
                                resolve(address)
                            } else {
                                resolve(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
                            }
                        })
                        .catch(() => {
                            resolve(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
                        })
                },
                () => {
                    clearTimeout(timeoutId)
                    setIsGettingLocation(false)
                    resolve('')
                },
                { 
                    enableHighAccuracy: true, 
                    timeout: 5000,
                    maximumAge: 0
                }
            )
        })
    }

async function loadData(month: string) {
    // Prevent concurrent execution
    if (isLoadingRef.current) {
        console.log('loadData already in progress, skipping...')
        return
    }
    
    isLoadingRef.current = true
    
    try {
        const approvedLeaves = await fetchLeaveRequests()
        const approvedOvertimes = await fetchOvertimeRequests()
        const approvedTravelOrders = await fetchTravelOrderRequests()
        
        // ✅ Create DTR records for ALL approved requests (including future months)
        await createDTRRecordsForRequests(approvedLeaves, approvedOvertimes, approvedTravelOrders)
        
        // Then fetch records for the selected month
        await fetchDTRRecords(month, approvedLeaves, approvedOvertimes, approvedTravelOrders)
    } finally {
        isLoadingRef.current = false
    }
}

// ✅ Create DTR records for ALL approved requests (past, present, and future) - No month filtering
async function createDTRRecordsForRequests(leaves: LeaveRequest[], overtimes: OvertimeRequest[], travelOrders: TravelOrderRequest[]) {
    if (!session?.user?.id) return
    
    try {
        // Fetch ALL existing DTR records (no month filtering)
        const response = await axios.get(`/api/dtr/${session.user.id}`)
        const existingRecords = response.data.data || []
        
        // Create a Set of dates that already have records
        const existingDates = new Set(existingRecords.map((record: any) => record.date))
        
        const datesToCreate = new Set<string>()
        
        // Helper function to get local date string
        const getLocalDateStr = (date: Date): string => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        }
        
        // Process ALL leaves - create for ALL dates in range (including future)
        leaves.forEach(leave => {
            const start = new Date(leave.startDate)
            const end = new Date(leave.endDate)
            
            // IMPORTANT: Reset time to midnight for proper date comparison
            const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
            const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate())
            
            let current = new Date(startDate)
            
            // Compare dates without time (using getDate, getMonth, getFullYear)
            while (current.getTime() <= endDate.getTime()) {
                const dateStr = getLocalDateStr(current)
                if (!existingDates.has(dateStr)) {
                    datesToCreate.add(dateStr)
                }
                current.setDate(current.getDate() + 1)
            }
        })
        
        // Process ALL overtimes - create for ALL dates in range (including future)
        overtimes.forEach(overtime => {
            const start = new Date(overtime.startDate)
            const end = new Date(overtime.endDate)
            
            const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
            const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate())
            
            let current = new Date(startDate)
            
            while (current.getTime() <= endDate.getTime()) {
                const dateStr = getLocalDateStr(current)
                if (!existingDates.has(dateStr)) {
                    datesToCreate.add(dateStr)
                }
                current.setDate(current.getDate() + 1)
            }
        })
        
        // Process ALL travel orders - create for ALL dates in range (including future)
        travelOrders.forEach(travelOrder => {
            const start = new Date(travelOrder.startDate)
            const end = new Date(travelOrder.endDate)
            
            const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
            const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate())
            
            let current = new Date(startDate)
            
            while (current.getTime() <= endDate.getTime()) {
                const dateStr = getLocalDateStr(current)
                if (!existingDates.has(dateStr)) {
                    datesToCreate.add(dateStr)
                }
                current.setDate(current.getDate() + 1)
            }
        })
        
        // Create records for ALL dates that don't exist (including future)
        if (datesToCreate.size > 0) {
            console.log(`📝 Creating ${datesToCreate.size} DTR records for dates:`, Array.from(datesToCreate))
        }
        
        for (const date of datesToCreate) {
            try {
                const payload = {
                    date: date,
                    session: 'morning',
                    status: 'Leave'
                }
                
                await axios.post(`/api/dtr/${session.user.id}`, payload)
                console.log(`✅ Created DTR record for ${date}`)
            } catch (error) {
                console.error(`Failed to create DTR record for ${date}:`, error)
            }
        }
        
    } catch (error) {
        console.error('Error creating DTR records for requests:', error)
    }
}
    // ✅ Session detection
    const getCurrentSession = () => {
        const hour = currentTime.getHours()
        const minutes = currentTime.getMinutes()
        
        if ((hour >= 6 && hour < 13) || (hour === 13 && minutes === 0)) return 'morning'
        else if ((hour >= 13 && hour < 19) || (hour === 19 && minutes === 0)) return 'afternoon'
        return null
    }

    const isTimeAllowed = () => {
        const hour = currentTime.getHours()
        const minutes = currentTime.getMinutes()
        if ((hour >= 6 && hour < 19) || (hour === 19 && minutes === 0)) return true
        return false
    }

    function calculateTotalHours(timeIn: string, timeOut: string): string {
        if (!timeIn || !timeOut) return '-'
        
        const [inHours, inMinutes] = timeIn.split(':').map(Number)
        const [outHours, outMinutes] = timeOut.split(':').map(Number)
        
        let totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes)
        if (totalMinutes < 0) totalMinutes += 24 * 60
        
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }

    function calculateDayTotal(timeInAM: string, timeOutAM: string, timeInPM: string, timeOutPM: string): string {
        let totalMinutes = 0
        
        if (timeInAM && timeOutAM) {
            const [inH, inM] = timeInAM.split(':').map(Number)
            const [outH, outM] = timeOutAM.split(':').map(Number)
            let mins = (outH * 60 + outM) - (inH * 60 + inM)
            if (mins < 0) mins += 24 * 60
            totalMinutes += mins
        }
        
        if (timeInPM && timeOutPM) {
            const [inH, inM] = timeInPM.split(':').map(Number)
            const [outH, outM] = timeOutPM.split(':').map(Number)
            let mins = (outH * 60 + outM) - (inH * 60 + inM)
            if (mins < 0) mins += 24 * 60
            totalMinutes += mins
        }
        
        if (totalMinutes === 0) return '-'
        
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }

    // ✅ Map Pass Slip type to DTR status
    function mapPassSlipTypeToStatus(type: string): string | null {
        switch(type) {
            case 'Official':
                return 'Vacation Leave'
            case 'Personal':
                return 'Personal Calamity'
            case 'Emergency':
                return 'Sick Leave'
            default:
                return null
        }
    }

    // ✅ Count leaves directly from the leaveRequests (for leaves without DTR records)
    function countLeavesFromRequests(leaves: LeaveRequest[], month: string) {
        let sickLeave = 0
        let vacationLeave = 0
        let personalCalamity = 0
        
        leaves.forEach(leave => {
            const startDate = new Date(leave.startDate)
            const monthStr = startDate.toISOString().slice(0, 7)
            
            if (monthStr === month) {
                if (leave.type === 'Personal') personalCalamity++
                else if (leave.type === 'Emergency') sickLeave++
                else if (leave.type === 'Official') vacationLeave++
            }
        })
        
        return { sickLeave, vacationLeave, personalCalamity }
    }

    // ✅ Fetch ALL approved pass slips with purpose and destination
    async function fetchLeaveRequests() {
        if (!session?.user?.id) return []
        
        try {
            const response = await axios.get(`/api/pass_slip/${session.user.id}`)
            const records = response.data.data || []
            
            const approvedLeaves = records.filter((record: any) => {
                return record.status === 'Approved'
            }).map((record: any) => ({
                id: record.id,
                startDate: record.startDate,
                endDate: record.endDate,
                type: record.type,
                status: record.status,
                purpose: record.purpose || '',
                destination: record.destination || ''
            }))
            
            setLeaveRequests(approvedLeaves)
            return approvedLeaves
        } catch (error: any) {
            if (error.response?.status !== 404) {
                console.error('Error fetching pass slips:', error)
            }
            setLeaveRequests([])
            return []
        }
    }

    // ✅ Fetch ALL approved overtime requests with purpose and destination
    async function fetchOvertimeRequests() {
        if (!session?.user?.id) return []
        
        try {
            const response = await axios.get(`/api/overtime_request/${session.user.id}`)
            const records = response.data.data || []
            
            const approvedOvertimes = records.filter((record: any) => {
                return record.status === 'Approved'
            }).map((record: any) => ({
                id: record.id,
                startDate: record.startDate,
                endDate: record.endDate,
                hours: record.hours || '0',
                status: record.status,
                purpose: record.purpose || '',
                destination: record.destination || ''
            }))
            
            setOvertimeRequests(approvedOvertimes)
            return approvedOvertimes
        } catch (error: any) {
            if (error.response?.status !== 404) {
                console.error('Error fetching overtime requests:', error)
            }
            setOvertimeRequests([])
            return []
        }
    }

    // ✅ Fetch ALL approved travel order requests with purpose and destination
    async function fetchTravelOrderRequests() {
        if (!session?.user?.id) return []
        
        try {
            const response = await axios.get(`/api/travel_order/${session.user.id}`)
            const records = response.data.data || []
            
            const approvedTravelOrders = records.filter((record: any) => {
                return record.status === 'Approved'
            }).map((record: any) => ({
                id: record.id,
                startDate: record.startDate,
                endDate: record.endDate,
                purpose: record.purpose || '',
                destination: record.destination || '',
                status: record.status,
                expectedOutput: record.expectedOutput || ''
            }))
            
            setTravelOrderRequests(approvedTravelOrders)
            return approvedTravelOrders
        } catch (error: any) {
            if (error.response?.status !== 404) {
                console.error('Error fetching travel orders:', error)
            }
            setTravelOrderRequests([])
            return []
        }
    }

function calculateRealStats(records: DTRRecord[]) {
    let tardiness = 0
    let undertime = 0
    let overtime = 0
    let sickLeave = 0
    let vacationLeave = 0
    let personalCalamity = 0

    // Deduplicate records by date - keep the one with time data if it exists
    const uniqueRecords = new Map<string, DTRRecord>()
    
    records.forEach(record => {
        const existing = uniqueRecords.get(record.date)
        
        // If no existing record, or current record has time data and existing doesn't
        if (!existing || 
            (record.timeInAM && !existing.timeInAM) ||
            (record.timeOutAM && !existing.timeOutAM) ||
            (record.timeInPM && !existing.timeInPM) ||
            (record.timeOutPM && !existing.timeOutPM)) {
            uniqueRecords.set(record.date, record)
        }
    })
    
    const dedupedRecords = Array.from(uniqueRecords.values())

    dedupedRecords.forEach(record => {
        if (record.leaveStatus === 'Sick Leave') {
            sickLeave++
        } else if (record.leaveStatus === 'Vacation Leave') {
            vacationLeave++
        } else if (record.leaveStatus === 'Personal Calamity') {
            personalCalamity++
        }
        
        const totalHours = record.totalHours
        if (totalHours && totalHours !== '-') {
            const [hours, minutes] = totalHours.split(':').map(Number)
            const totalMinutes = (hours || 0) * 60 + (minutes || 0)
            
            if (totalMinutes > 0) {
                if (totalMinutes < 480) {
                    undertime++
                } else if (totalMinutes > 480) {
                    overtime++
                }
            }
        }
        
        if (record.timeInAM) {
            const [inHours, inMinutes] = record.timeInAM.split(':').map(Number)
            const timeInMinutes = inHours * 60 + inMinutes
            if (timeInMinutes > 435) {
                tardiness++
            }
        }
    })

    return { tardiness, undertime, overtime, sickLeave, vacationLeave, personalCalamity }
}
    // ✅ Count approved overtime requests for the selected month
    function countOvertimeRequests(overtimes: OvertimeRequest[], month: string) {
        let count = 0
        
        overtimes.forEach(overtime => {
            const startDate = new Date(overtime.startDate)
            const monthStr = startDate.toISOString().slice(0, 7)
            
            if (monthStr === month) {
                count++
            }
        })
        
        return count
    }

    // ✅ Count approved travel order requests for the selected month
    function countTravelOrderRequests(travelOrders: TravelOrderRequest[], month: string) {
        let count = 0
        
        travelOrders.forEach(travelOrder => {
            const startDate = new Date(travelOrder.startDate)
            const monthStr = startDate.toISOString().slice(0, 7)
            
            if (monthStr === month) {
                count++
            }
        })
        
        return count
    }

// ✅ Check if a date has an approved pass slip and map to DTR status
function getLeaveStatusForDate(dateStr: string, leaves: LeaveRequest[]): string | null {
    const [year, month, day] = dateStr.split('-').map(Number)
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    for (const leave of leaves) {
        const start = new Date(leave.startDate)
        const end = new Date(leave.endDate)
        
        const startYear = start.getFullYear()
        const startMonth = String(start.getMonth() + 1).padStart(2, '0')
        const startDay = String(start.getDate()).padStart(2, '0')
        const startDateStr = `${startYear}-${startMonth}-${startDay}`
        
        const endYear = end.getFullYear()
        const endMonth = String(end.getMonth() + 1).padStart(2, '0')
        const endDay = String(end.getDate()).padStart(2, '0')
        const endDateStr = `${endYear}-${endMonth}-${endDay}`
        
        if (dateString >= startDateStr && dateString <= endDateStr) {
            const status = mapPassSlipTypeToStatus(leave.type)
            if (status) {
                return status
            }
        }
    }
    return null
}

// ✅ Get leave details for a date - returns array of all details
function getLeaveDetailsForDate(dateStr: string, leaves: LeaveRequest[], overtimes: OvertimeRequest[], travelOrders: TravelOrderRequest[]): any[] {
    const [year, month, day] = dateStr.split('-').map(Number)
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    const details: any[] = []
    
    // Check pass slips
    for (const leave of leaves) {
        const start = new Date(leave.startDate)
        const end = new Date(leave.endDate)
        
        const startYear = start.getFullYear()
        const startMonth = String(start.getMonth() + 1).padStart(2, '0')
        const startDay = String(start.getDate()).padStart(2, '0')
        const startDateStr = `${startYear}-${startMonth}-${startDay}`
        
        const endYear = end.getFullYear()
        const endMonth = String(end.getMonth() + 1).padStart(2, '0')
        const endDay = String(end.getDate()).padStart(2, '0')
        const endDateStr = `${endYear}-${endMonth}-${endDay}`
        
        if (dateString >= startDateStr && dateString <= endDateStr) {
            details.push({
                type: leave.type,
                purpose: leave.purpose || '',
                startTime: new Date(leave.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                endTime: new Date(leave.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                destination: leave.destination || ''
            })
        }
    }
    
    // Check overtime requests
    for (const overtime of overtimes) {
        const start = new Date(overtime.startDate)
        const end = new Date(overtime.endDate)
        
        const startYear = start.getFullYear()
        const startMonth = String(start.getMonth() + 1).padStart(2, '0')
        const startDay = String(start.getDate()).padStart(2, '0')
        const startDateStr = `${startYear}-${startMonth}-${startDay}`
        
        const endYear = end.getFullYear()
        const endMonth = String(end.getMonth() + 1).padStart(2, '0')
        const endDay = String(end.getDate()).padStart(2, '0')
        const endDateStr = `${endYear}-${endMonth}-${endDay}`
        
        if (dateString >= startDateStr && dateString <= endDateStr) {
            details.push({
                type: 'Overtime',
                purpose: overtime.purpose || '',
                startTime: new Date(overtime.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                endTime: new Date(overtime.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                destination: overtime.destination || ''
            })
        }
    }
    
    // Check travel orders
for (const travelOrder of travelOrders) {
    const start = new Date(travelOrder.startDate)
    const end = new Date(travelOrder.endDate)
    
    const startYear = start.getFullYear()
    const startMonth = String(start.getMonth() + 1).padStart(2, '0')
    const startDay = String(start.getDate()).padStart(2, '0')
    const startDateStr = `${startYear}-${startMonth}-${startDay}`
    
    const endYear = end.getFullYear()
    const endMonth = String(end.getMonth() + 1).padStart(2, '0')
    const endDay = String(end.getDate()).padStart(2, '0')
    const endDateStr = `${endYear}-${endMonth}-${endDay}`
    
    if (dateString >= startDateStr && dateString <= endDateStr) {
        // ✅ Format as dates instead of times
        const formattedStartDate = start.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        const formattedEndDate = end.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        
        details.push({
            type: 'Travel Order',
            purpose: travelOrder.purpose || '',
            startDate: formattedStartDate,  // ✅ Changed from startTime
            endDate: formattedEndDate,      // ✅ Changed from endTime
            destination: travelOrder.destination || ''
        })
    }
}
    return details
}

    async function checkTodayRecord() {
        try {
            const today = new Date().toISOString().split('T')[0]
            const response = await axios.get(`/api/dtr/${session?.user?.id}`)
            const records = response.data.data || []
            
            const todayRecord = records.find((record: any) => record.date === today)
            if (todayRecord) {
                setTimeInAM(todayRecord.timeInAM || null)
                setTimeOutAM(todayRecord.timeOutAM || null)
                setTimeInPM(todayRecord.timeInPM || null)
                setTimeOutPM(todayRecord.timeOutPM || null)
                setLocationInAM(todayRecord.locationInAM || null)
                setLocationOutAM(todayRecord.locationOutAM || null)
                setLocationInPM(todayRecord.locationInPM || null)
                setLocationOutPM(todayRecord.locationOutPM || null)
                setIsTimeInAM(!!todayRecord.timeInAM)
                setIsTimeOutAM(!!todayRecord.timeOutAM)
                setIsTimeInPM(!!todayRecord.timeInPM)
                setIsTimeOutPM(!!todayRecord.timeOutPM)
                setHasTodayRecord(true)
            } else {
                setTimeInAM(null)
                setTimeOutAM(null)
                setTimeInPM(null)
                setTimeOutPM(null)
                setLocationInAM(null)
                setLocationOutAM(null)
                setLocationInPM(null)
                setLocationOutPM(null)
                setIsTimeInAM(false)
                setIsTimeOutAM(false)
                setIsTimeInPM(false)
                setIsTimeOutPM(false)
                setHasTodayRecord(false)
            }
        } catch (error: any) {
            if (error.response?.status !== 404) {
                console.error('Error checking today\'s record:', error)
            }
            setTimeInAM(null)
            setTimeOutAM(null)
            setTimeOutPM(null)
            setIsTimeInAM(false)
            setIsTimeOutAM(false)
            setIsTimeInPM(false)
            setIsTimeOutPM(false)
            setHasTodayRecord(false)
        }
    }

async function fetchDTRRecords(month: string, leaves: LeaveRequest[] = [], overtimes: OvertimeRequest[] = [], travelOrders: TravelOrderRequest[] = []) {
    if (!session?.user?.id) return
    
    try {
        const response = await axios.get(`/api/dtr/${session.user.id}`)
        const records = response.data.data || []
        
        const filtered = records.filter((record: any) => 
            record.date?.startsWith(month)
        )
        
        const formattedRecords: DTRRecord[] = filtered.map((record: any) => {
            const leaveStatus = getLeaveStatusForDate(record.date, leaves)
            const leaveDetails = getLeaveDetailsForDate(record.date, leaves, overtimes, travelOrders)
            
            const formatted = {
                id: record.id || '',
                date: record.date || '',
                timeInAM: record.timeInAM || '',
                timeOutAM: record.timeOutAM || '',
                timeInPM: record.timeInPM || '',
                timeOutPM: record.timeOutPM || '',
                totalHours: calculateDayTotal(
                    record.timeInAM, 
                    record.timeOutAM, 
                    record.timeInPM, 
                    record.timeOutPM
                ),
                status: record.status || 'Present',
                leaveStatus: leaveStatus || undefined,
                locationInAM: record.locationInAM || '',
                locationOutAM: record.locationOutAM || '',
                locationInPM: record.locationInPM || '',
                locationOutPM: record.locationOutPM || '',
                leaveDetails: leaveDetails.length > 0 ? leaveDetails : undefined
            }
            
            return formatted
        })
        
        setDtrRecords(formattedRecords)
        
        // ✅ Calculate stats - count UNIQUE approved requests, not each day
        let tardiness = 0
        let undertime = 0
        let overtime = 0
        let sickLeave = 0
        let vacationLeave = 0
        let personalCalamity = 0
        
        // Count unique leaves from the leave requests array
        leaves.forEach(leave => {
            // Check if this leave's date range falls within the selected month
            const startDate = new Date(leave.startDate)
            const endDate = new Date(leave.endDate)
            const monthStart = new Date(month + '-01')
            const monthEnd = new Date(month + '-31')
            
            // If the leave overlaps with the selected month
            if (startDate <= monthEnd && endDate >= monthStart) {
                if (leave.type === 'Emergency') {
                    sickLeave++
                } else if (leave.type === 'Official') {
                    vacationLeave++
                } else if (leave.type === 'Personal') {
                    personalCalamity++
                }
            }
        })
        
        // Count DTR records with actual time data (not leave status)
        formattedRecords.forEach(record => {
            // Only count tardiness/undertime/overtime from records with actual time data
            if (record.timeInAM || record.timeOutAM || record.timeInPM || record.timeOutPM) {
                const totalHours = record.totalHours
                if (totalHours && totalHours !== '-') {
                    const [hours, minutes] = totalHours.split(':').map(Number)
                    const totalMinutes = (hours || 0) * 60 + (minutes || 0)
                    
                    if (totalMinutes > 0) {
                        if (totalMinutes < 480) {
                            undertime++
                        } else if (totalMinutes > 480) {
                            overtime++
                        }
                    }
                }
                
                if (record.timeInAM) {
                    const [inHours, inMinutes] = record.timeInAM.split(':').map(Number)
                    const timeInMinutes = inHours * 60 + inMinutes
                    if (timeInMinutes > 435) {
                        tardiness++
                    }
                }
            }
        })
        
        // Count overtime and travel orders from their respective requests
        const approvedOvertimeCount = countOvertimeRequests(overtimes, month)
        const approvedTravelOrderCount = countTravelOrderRequests(travelOrders, month)
        
        const finalStats = {
            tardiness: tardiness.toString(),
            undertime: undertime.toString(),
            overtime: (overtime + approvedOvertimeCount).toString(),
            sickLeave: sickLeave.toString(),
            vacationLeave: vacationLeave.toString(),
            personalCalamity: personalCalamity.toString(),
            travelOrder: approvedTravelOrderCount.toString()
        }
        
        setStats(finalStats)
        
    } catch (error: any) {
        if (error.response?.status !== 404) {
            console.error('Error fetching DTR records:', error)
        }
        setDtrRecords([])
    }
}
    // ✅ Handle status update
    async function handleStatusUpdate(recordId: string, date: string, newStatus: string) {
        if (!session?.user?.id) return
        
        try {
            const response = await axios.put(`/api/dtr/update-status/${session.user.id}`, {
                date: date,
                status: newStatus
            })
            
            if (response.status === 200) {
                setMessage('Status updated successfully')
                await loadData(selectedMonth)
                setEditingRecord(null)
                setEditingStatus('')
            }
        } catch (error: any) {
            console.error('Error updating status:', error)
            setMessage('❌ Error updating status')
        }
    }

    // ✅ Handle double click to edit
    function handleDoubleClick(date: string, currentStatus: string) {
        setEditingRecord(date)
        setEditingStatus(currentStatus)
    }

    // ✅ Handle Enter key to save
    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, recordId: string, date: string) {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (editingStatus.trim() !== '') {
                handleStatusUpdate(recordId, date, editingStatus)
            }
        } else if (e.key === 'Escape') {
            setEditingRecord(null)
            setEditingStatus('')
        }
    }

    // ✅ Handle blur to cancel edit
    function handleBlur() {
        if (editingRecord) {
            setEditingRecord(null)
            setEditingStatus('')
        }
    }

    function getDaysInMonth(year: number, month: number) {
        return new Date(year, month + 1, 0).getDate()
    }

    // ✅ Helper function to convert 24hr to 12hr format
    function formatTimeTo12Hour(time: string): string {
        if (!time || time === '-') return '-'
        
        const parts = time.split(':')
        if (parts.length < 2) return time
        
        let hours = parseInt(parts[0])
        const minutes = parts[1]
        
        if (isNaN(hours)) return time
        
        const ampm = hours >= 12 ? 'PM' : 'AM'
        hours = hours % 12
        hours = hours ? hours : 12
        
        return `${hours}:${minutes} ${ampm}`
    }

function generateMonthDays(month: string) {
    const [year, monthNum] = month.split('-').map(Number)
    const daysInMonth = getDaysInMonth(year, monthNum - 1)
    const days = []
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const date = new Date(year, monthNum - 1, day)
        
        const record = dtrRecords.find(r => r.date === dateStr)
        
        let totalHours = '-'
        let status = 'Absent'
        let leaveDetails = null
        
        if (record) {
            totalHours = record.totalHours || '-'
            status = record.status || 'Present'
            leaveDetails = record.leaveDetails || null
        }
        
        days.push({
            date: dateStr,
            day: day,
            record: record ? {
                ...record,
                timeInAM: record.timeInAM ? formatTimeTo12Hour(record.timeInAM) : '',
                timeOutAM: record.timeOutAM ? formatTimeTo12Hour(record.timeOutAM) : '',
                timeInPM: record.timeInPM ? formatTimeTo12Hour(record.timeInPM) : '',
                timeOutPM: record.timeOutPM ? formatTimeTo12Hour(record.timeOutPM) : ''
            } : null,
            totalHours: totalHours,
            status: status,
            leaveDetails: leaveDetails,
            isToday: dateStr === new Date().toISOString().split('T')[0],
            isFuture: date > new Date(),
            isWeekend: date.getDay() === 0 || date.getDay() === 6
        })
    }
    return days
}

    const monthDays = generateMonthDays(selectedMonth)

    async function handleTimeIn() {
        if (!session?.user?.id) {
            setMessage('Please login first')
            return
        }

        if (!isTimeAllowed()) {
            setMessage('Time-in is only available from 6:00 AM to 7:00 PM')
            return
        }

        const sessionType = getCurrentSession()
        if (!sessionType) {
            setMessage('Time-in is only available from 6:00 AM to 7:00 PM')
            return
        }

        if (sessionType === 'morning' && isTimeInAM) {
            setMessage('Already timed in for morning')
            return
        }
        if (sessionType === 'afternoon' && isTimeInPM) {
            setMessage('Already timed in for afternoon')
            return
        }

        if (sessionType === 'afternoon' && hasTodayRecord && !isTimeOutAM && isTimeInAM) {
            setMessage('Please complete morning session first')
            return
        }

        setLoading(true)
        setMessage('')

        try {
            const now = new Date()
            const timeString = now.toTimeString().split(' ')[0]
            const dateString = now.toISOString().split('T')[0]
            
            let location = ''
            try {
                location = await getCurrentLocation()
            } catch (e) {
                // Location failed silently, continue
            }
            
            const payload: any = {
                date: dateString,
                session: sessionType
            }
            
            if (sessionType === 'morning') {
                payload.timeInAM = timeString
                if (location) payload.locationInAM = location
            } else {
                payload.timeInPM = timeString
                if (location) payload.locationInPM = location
            }
            
            const response = await axios.post(`/api/dtr/${session.user.id}`, payload)

            if (response.status === 200 || response.status === 201) {
                if (sessionType === 'morning') {
                    setIsTimeInAM(true)
                    setTimeInAM(timeString)
                    if (location) setLocationInAM(location)
                } else {
                    setIsTimeInPM(true)
                    setTimeInPM(timeString)
                    if (location) setLocationInPM(location)
                }
                setMessage(`${location ? `  ${location}` : ''}`)
                setHasTodayRecord(true)
                await loadData(selectedMonth)
                await checkTodayRecord()
            }
        } catch (error: any) {
            console.error('Error recording time-in:', error)
            setMessage(error.response?.data?.message || 'Error recording time-in. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    async function handleTimeOut() {
        if (!session?.user?.id) {
            setMessage('Please login first')
            return
        }

        if (!isTimeAllowed()) {
            setMessage('Time-out is only available from 6:00 AM to 7:00 PM')
            return
        }

        const sessionType = getCurrentSession()
        if (!sessionType) {
            setMessage('Time-out is only available from 6:00 AM to 7:00 PM')
            return
        }

        if (sessionType === 'morning' && isTimeOutAM) {
            setMessage('Already timed out for morning')
            return
        }
        if (sessionType === 'afternoon' && isTimeOutPM) {
            setMessage('Already timed out for afternoon')
            return
        }

        if (sessionType === 'morning' && !isTimeInAM) {
            setMessage('Please time-in first')
            return
        }
        if (sessionType === 'afternoon' && !isTimeInPM) {
            setMessage('Please time-in first')
            return
        }

        setLoading(true)
        setMessage('')

        try {
            const now = new Date()
            const timeString = now.toTimeString().split(' ')[0]
            const dateString = now.toISOString().split('T')[0]
            
            let location = ''
            try {
                location = await getCurrentLocation()
            } catch (e) {
                // Location failed silently, continue
            }
            
            const payload: any = {
                date: dateString,
                session: sessionType
            }
            
            if (sessionType === 'morning') {
                payload.timeOutAM = timeString
                if (location) payload.locationOutAM = location
            } else {
                payload.timeOutPM = timeString
                if (location) payload.locationOutPM = location
            }
            
            const response = await axios.put(`/api/dtr/${session.user.id}`, payload)

            if (response.status === 200) {
                if (sessionType === 'morning') {
                    setIsTimeOutAM(true)
                    setTimeOutAM(timeString)
                    if (location) setLocationOutAM(location)
                } else {
                    setIsTimeOutPM(true)
                    setTimeOutPM(timeString)
                    if (location) setLocationOutPM(location)
                }
                setMessage(`${location ? `  ${location}` : ''}`)
                await loadData(selectedMonth)
                await checkTodayRecord()
            }
        } catch (error: any) {
            console.error('Error recording time-out:', error)
            setMessage(error.response?.data?.message || 'Error recording time-out. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    })

    const formattedDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const month = e.target.value
        setSelectedMonth(month)
        loadData(month)
    }

    const currentSession = getCurrentSession()
    const isMorningSession = currentSession === 'morning'
    const isAfternoonSession = currentSession === 'afternoon'
    const timeAllowed = isTimeAllowed()

    const canTimeIn = timeAllowed && (
        (isMorningSession && !isTimeInAM) ||
        (isMorningSession && isTimeOutAM) ||
        (isAfternoonSession && !isTimeInPM && (!hasTodayRecord || isTimeOutAM || !isTimeInAM)) ||
        (isAfternoonSession && isTimeOutPM)
    )

    const canTimeOut = timeAllowed && (
        (isMorningSession && isTimeInAM && !isTimeOutAM) ||
        (isAfternoonSession && isTimeInPM && !isTimeOutPM)
    )

    const isTimeInDisabled = loading || !canTimeIn
    const isTimeOutDisabled = loading || !canTimeOut

    return(
        <div className='flex flex-col w-full bg-gray-200'>
            <ContentHeader />
            
            <div className='flex'>
                <div className='flex flex-col bg-white items-center justify-center my-5 mx-10 px-10 py-5 gap-2 border border-black rounded-xl'>
                    <p className='font-bold text-[36px]'>{formattedTime}</p>
                    <p className='text-gray-800 text-[16px]'>{formattedDate}</p>
                     
                    <div className='flex gap-4 mt-1'>
                        <span className={`text-sm font-semibold ${isMorningSession ? 'text-green-600' : 'text-gray-400'}`}>
                            Morning
                            {isTimeInAM && !isTimeOutAM ? ' ' : isTimeOutAM ? ' ' : ''}
                        </span>
                        <span className={`text-sm font-semibold ${isAfternoonSession ? 'text-orange-600' : 'text-gray-400'}`}>
                            Afternoon
                            {isTimeInPM && !isTimeOutPM ? ' ' : isTimeOutPM ? ' ' : ''}
                        </span>
                    </div>

                    {!timeAllowed && (
                        <p className='text-xs text-red-500 mt-1'>Time-in/out available from 6:00 AM to 7:00 PM</p>
                    )}

                    {message && (
                        <p className={`text-sm font-semibold ${message.includes('✅') ? 'text-green-600' : message.includes('⚠️') ? 'text-yellow-600' : message.includes('❌') ? 'text-red-600' : 'text-blue-600'}`}>
                            {message}
                        </p>
                    )}

                    <div className='flex gap-2 mt-2'>
                        <input 
                            className={`font-semibold text-white px-6 py-1 rounded-lg cursor-pointer transition-colors disabled:opacity-50 ${
                                isTimeInDisabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                            }`}
                            type='button' 
                            value={isGettingLocation ? 'Getting GPS...' : 'Time In'}
                            onClick={handleTimeIn}
                            disabled={isTimeInDisabled}
                        />
                        <input 
                            className={`font-semibold text-white px-6 py-1 rounded-lg cursor-pointer transition-colors disabled:opacity-50 ${
                                isTimeOutDisabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                            }`}
                            type='button' 
                            value={isGettingLocation ? 'Getting GPS...' : 'Time Out'}
                            onClick={handleTimeOut}
                            disabled={isTimeOutDisabled}
                        />
                    </div>
                    {isGettingLocation && (
                        <p className='text-xs text-blue-500 mt-1'> Getting your GPS location...</p>
                    )}
                </div>
                
                {/* Statistics Card - Arranged in Rows */}
                <div className='flex flex-col bg-white items-center justify-evenly my-5 mr-10 flex-1 rounded-xl border border-black py-5'>
                    {/* Row 1: Tardiness, Personal Calamity, Sick Leave */}
                    <div className='flex w-full justify-evenly'>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Tardiness</p>
                            <p className='text-3xl'>{stats.tardiness}</p>
                        </div>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Personal Calamity</p>
                            <p className='text-3xl'>{stats.personalCalamity}</p>
                        </div>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Sick Leave</p>
                            <p className='text-3xl'>{stats.sickLeave}</p>
                        </div>
                    </div>

                    {/* Row 2: Undertime, Overtime, Vacation Leave, Travel Order */}
                    <div className='flex w-full justify-evenly mt-2'>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Undertime</p>
                            <p className='text-3xl'>{stats.undertime}</p>
                        </div>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Overtime</p>
                            <p className='text-3xl'>{stats.overtime}</p>
                        </div>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Vacation Leave</p>
                            <p className='text-3xl'>{stats.vacationLeave}</p>
                        </div>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Travel Order</p>
                            <p className='text-3xl'>{stats.travelOrder}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className='flex flex-col bg-white mx-10 rounded-xl border border-black gap-4'>
                <div className='flex justify-between items-center p-5 border-b border-black'>
                    <p className='font-bold text-xl'>Attendance Logs</p>
                    <button className='flex gap-2 items-center bg-linear-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)] py-1 px-5 rounded-lg text-white cursor-pointer'>
                        <Image src='/print.svg' width={16} height={16} alt='print'/>
                        <p className='font-semibold'>Print</p>
                    </button>
                </div>
                <div>
                    <input 
                        onChange={handleMonthChange} 
                        className='border outline-0 border-black px-5 py-1 mx-10 rounded-lg' 
                        type='month' 
                        value={selectedMonth}
                    />
                </div>
                <div className='flex flex-col border-2 border-gray-400 mx-5 mb-5 rounded-lg overflow-x-auto'>
                    <table className='text-gray-700 w-full'>
                        <thead className='bg-gray-200 border-b-2 border-gray-400'>
                            <tr>
                                <th className='border-r border-gray-400' rowSpan={2}>Day</th>
                                <th className='border-r border-b py-1 border-gray-400' colSpan={2}>Morning</th>
                                <th className='border-r border-b border-gray-400' colSpan={2}>Afternoon</th>
                                <th className='border-r border-b border-gray-400' rowSpan={2}>Total Hours</th>
                                <th rowSpan={2}>Remarks</th>
                            </tr>
                            <tr>
                                <th className='border-r py-1 border-gray-400'>In</th>
                                <th className='border-r border-gray-400'>Out</th>
                                <th className='border-r border-gray-400'>In</th>
                                <th className='border-r border-gray-400'>Out</th>
                            </tr>
                        </thead>
                        <tbody className='text-center bg-white'>
                            {monthDays.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className='py-4 text-gray-500'>No records found for this month</td>
                                </tr>
                            ) : (
                                monthDays.map((dayData) => (
                                    <tr 
                                        key={dayData.date} 
                                        className={`border-t border-gray-400 hover:bg-gray-50 ${
                                            dayData.isToday ? 'bg-blue-50' : ''
                                        } ${dayData.isFuture ? 'text-gray-400' : ''} ${
                                            dayData.isWeekend ? 'bg-gray-100' : ''
                                        }`}
                                    >
                                        <td className='border-r border-gray-400 py-1 px-2 font-medium'>
                                            {dayData.day}
                                        </td>
                                        <td className='border-r border-gray-400'>
                                            <div className='flex flex-col'>
                                                <span>{dayData.record?.timeInAM || '-'}</span>
                                                {dayData.record?.locationInAM && (
                                                    <span className='text-xs text-gray-500'>{dayData.record.locationInAM}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className='border-r border-gray-400'>
                                            <div className='flex flex-col'>
                                                <span>{dayData.record?.timeOutAM || '-'}</span>
                                                {dayData.record?.locationOutAM && (
                                                    <span className='text-xs text-gray-500'>{dayData.record.locationOutAM}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className='border-r border-gray-400'>
                                            <div className='flex flex-col'>
                                                <span>{dayData.record?.timeInPM || '-'}</span>
                                                {dayData.record?.locationInPM && (
                                                    <span className='text-xs text-gray-500'>{dayData.record.locationInPM}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className='border-r border-gray-400'>
                                            <div className='flex flex-col'>
                                                <span>{dayData.record?.timeOutPM || '-'}</span>
                                                {dayData.record?.locationOutPM && (
                                                    <span className='text-xs text-gray-500'>{dayData.record.locationOutPM}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className='border-r border-gray-400 font-medium'>
                                            {dayData.totalHours}
                                        </td>
                                        <td>
                                            {dayData.isFuture ? '-' : (
                                                dayData.isWeekend ? 'Weekend' : (
                                                    editingRecord === dayData.date ? (
                                                        <input
                                                            ref={inputRef}
                                                            type="text"
                                                            value={editingStatus}
                                                            onChange={(e) => setEditingStatus(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (dayData.record) {
                                                                    handleKeyDown(e, dayData.record.id, dayData.date)
                                                                }
                                                            }}
                                                            onBlur={handleBlur}
                                                            className="border border-blue-500 rounded px-1 py-0.5 text-sm w-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            placeholder="Enter status..."
                                                        />
                                                    ) : (
                                                        <>
{dayData.leaveDetails && dayData.leaveDetails.length > 0 && (
    <div className='text-xs text-left text-gray-700 space-y-0.5'>
        {dayData.leaveDetails.map((detail, index) => {
            let displayType = ''
            if (detail.type === 'Personal') displayType = 'Personal Calamity'
            else if (detail.type === 'Emergency') displayType = 'Sick Leave'
            else if (detail.type === 'Official') displayType = 'Vacation Leave'
            else if (detail.type === 'Overtime') displayType = 'Overtime'
            else if (detail.type === 'Travel Order') displayType = 'Travel Order'
            else displayType = detail.type
            
            return (
                <div key={index}>
                    {displayType}: {detail.purpose}
                    {(detail.type === 'Personal' || detail.type === 'Emergency' || detail.type === 'Official' || detail.type === 'Overtime') && (
                        <span className='text-gray-500'> ({detail.startTime} - {detail.endTime})</span>
                    )}
                    {detail.type === 'Travel Order' && detail.startDate && detail.endDate && (
                        <span className='text-gray-500'> ({detail.startDate} - {detail.endDate})</span>
                    )}
                </div>
            )
        })}
    </div>
)}
                                                            {(!dayData.leaveDetails || dayData.leaveDetails.length === 0) && (
                                                                <span 
                                                                    onDoubleClick={() => {
                                                                        if (!dayData.isFuture && dayData.record) {
                                                                            handleDoubleClick(dayData.date, dayData.status)
                                                                        }
                                                                    }}
                                                                    className={`${!dayData.isFuture && dayData.record ? 'cursor-pointer hover:text-blue-600 hover:underline' : 'cursor-default'}`}
                                                                    title={!dayData.isFuture && dayData.record ? 'Double-click to edit' : ''}
                                                                >
                                                                    {dayData.status}
                                                                </span>
                                                            )}
                                                        </>
                                                    )
                                                )
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}