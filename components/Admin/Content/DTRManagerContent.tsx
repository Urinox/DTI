// components/Admin/Content/DTRManagerContent.tsx
import ContentHeader from "@/components/ContentHeader"
import Image from "next/image"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useSession } from "next-auth/react"
import axios from "axios"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Employee {
    id: string
    employeeId: string
    username: string
    name: string
    email: string
    designation: string
    division: string
    office: string
    role?: string
}

interface DTRRecord {
    id: string
    employeeId: string
    employeeName: string
    date: string
    timeInAM: string
    timeOutAM: string
    timeInPM: string
    timeOutPM: string
    totalHours: string
    status: string
    locationInAM: string
    locationOutAM: string
    locationInPM: string
    locationOutPM: string
    leaveDetails?: any[]
}

interface PassSlip {
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

// Cache keys
const CACHE_KEY = 'dtr_manager_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function DTRManagerContent() {
    const { data: session } = useSession()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [dtrRecords, setDtrRecords] = useState<DTRRecord[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<string>('all')
    const [selectedMonth, setSelectedMonth] = useState('')
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [editingRecord, setEditingRecord] = useState<string | null>(null)
    const [editingStatus, setEditingStatus] = useState<string>('')
    const [searchTerm, setSearchTerm] = useState('')
    const [message, setMessage] = useState('')
    const [selectedDetail, setSelectedDetail] = useState<any>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const itemsPerPage = 10
    const [passSlipsCache, setPassSlipsCache] = useState<Record<string, PassSlip[]>>({})
    const [overtimeCache, setOvertimeCache] = useState<Record<string, OvertimeRequest[]>>({})
    const [travelOrderCache, setTravelOrderCache] = useState<Record<string, TravelOrderRequest[]>>({})
    const isLoadingRef = useRef(false)

    useEffect(() => {
        const now = new Date()
        const month = now.toISOString().slice(0, 7)
        setSelectedMonth(month)
        fetchEmployees()
    }, [session])

    useEffect(() => {
        if (employees.length > 0) {
            fetchAllDTRRecords(selectedMonth)
        }
    }, [employees, selectedMonth])

    useEffect(() => {
        if (editingRecord && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [editingRecord])

    // ✅ Memoized filtered records
    const filteredRecords = useMemo(() => {
        let filtered = [...dtrRecords]
        
        if (selectedEmployee !== 'all') {
            filtered = filtered.filter(record => record.employeeId === selectedEmployee)
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(record => 
                record.employeeName.toLowerCase().includes(term) ||
                record.employeeId.includes(term)
            )
        }
        
        return filtered
    }, [dtrRecords, selectedEmployee, searchTerm])

    // ✅ Memoized paginated records
    const totalPages = useMemo(() => Math.ceil(filteredRecords.length / itemsPerPage), [filteredRecords.length])
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentRecords = useMemo(() => filteredRecords.slice(startIndex, endIndex), [filteredRecords, startIndex, endIndex])

    // ✅ Calculate total hours function
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

    async function fetchEmployees() {
        try {
            if (!session?.user?.id) return
            
            const response = await axios.get('/api/admin/employees')
            const data = response.data.data || []
            
            const cosUsers = data.filter((user: any) => user.role === 'cos' || user.role === 'COS-JO')
            
            const formattedEmployees = cosUsers.map((user: any, index: number) => ({
                id: user.id || '',
                employeeId: user.employeeId || (index + 1).toString().padStart(5, '0'),
                username: user.username || '',
                name: user.profile?.name || user.username || 'Unknown',
                email: user.email || '',
                designation: user.profile?.designation || 'N/A',
                division: user.profile?.division || '',
                office: user.profile?.office || '',
                role: user.role || 'cos'
            }))
            
            setEmployees(formattedEmployees)
            console.log(`✅ Loaded ${formattedEmployees.length} COS-JO employees`)
        } catch (error) {
            console.error('Error fetching employees:', error)
            setEmployees([])
        }
    }

    async function fetchPassSlips(userId: string): Promise<PassSlip[]> {
        if (passSlipsCache[userId]) {
            return passSlipsCache[userId]
        }
        
        try {
            const response = await axios.get(`/api/pass_slip/${userId}`)
            const records = response.data.data || []
            
            const approvedPassSlips = records
                .filter((record: any) => record.status === 'Approved')
                .map((record: any) => ({
                    id: record.id,
                    startDate: record.startDate,
                    endDate: record.endDate,
                    type: record.type,
                    status: record.status,
                    purpose: record.purpose || '',
                    destination: record.destination || ''
                }))
            
            passSlipsCache[userId] = approvedPassSlips
            return approvedPassSlips
        } catch (error: any) {
            if (error.response?.status !== 404) {
                console.error(`Error fetching pass slips for user ${userId}:`, error)
            }
            return []
        }
    }

    async function fetchOvertimeRequests(userId: string): Promise<OvertimeRequest[]> {
        if (overtimeCache[userId]) {
            return overtimeCache[userId]
        }
        
        try {
            const response = await axios.get(`/api/overtime_request/${userId}`)
            const records = response.data.data || []
            
            const approvedOvertimes = records
                .filter((record: any) => record.status === 'Approved')
                .map((record: any) => ({
                    id: record.id,
                    startDate: record.startDate,
                    endDate: record.endDate,
                    hours: record.hours || '0',
                    status: record.status,
                    purpose: record.purpose || ''
                }))
            
            overtimeCache[userId] = approvedOvertimes
            return approvedOvertimes
        } catch (error: any) {
            if (error.response?.status !== 404) {
                console.error(`Error fetching overtime requests for user ${userId}:`, error)
            }
            return []
        }
    }

    async function fetchTravelOrderRequests(userId: string): Promise<TravelOrderRequest[]> {
        if (travelOrderCache[userId]) {
            return travelOrderCache[userId]
        }
        
        try {
            const response = await axios.get(`/api/travel_order/${userId}`)
            const records = response.data.data || []
            
            const approvedTravelOrders = records
                .filter((record: any) => record.status === 'Approved')
                .map((record: any) => ({
                    id: record.id,
                    startDate: record.startDate,
                    endDate: record.endDate,
                    purpose: record.purpose || '',
                    destination: record.destination || '',
                    status: record.status,
                    expectedOutput: record.expectedOutput || ''
                }))
            
            travelOrderCache[userId] = approvedTravelOrders
            return approvedTravelOrders
        } catch (error: any) {
            if (error.response?.status !== 404) {
                console.error(`Error fetching travel orders for user ${userId}:`, error)
            }
            return []
        }
    }

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

    function getLocalDateStr(date: Date): string {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
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

    // ✅ Optimized: Pre-calculate date ranges once
    function getLeaveDetailsForDateOptimized(
        dateStr: string, 
        passSlips: PassSlip[], 
        overtimes: OvertimeRequest[], 
        travelOrders: TravelOrderRequest[]
    ): any[] {
        const details: any[] = []
        
        const passSlipRanges = passSlips.map(slip => ({
            ...slip,
            startStr: getLocalDateStr(new Date(slip.startDate)),
            endStr: getLocalDateStr(new Date(slip.endDate))
        }))
        
        const overtimeRanges = overtimes.map(ot => ({
            ...ot,
            startStr: getLocalDateStr(new Date(ot.startDate)),
            endStr: getLocalDateStr(new Date(ot.endDate))
        }))
        
        const travelOrderRanges = travelOrders.map(to => ({
            ...to,
            startStr: getLocalDateStr(new Date(to.startDate)),
            endStr: getLocalDateStr(new Date(to.endDate))
        }))
        
        for (const slip of passSlipRanges) {
            if (dateStr >= slip.startStr && dateStr <= slip.endStr) {
                details.push({
                    type: slip.type,
                    purpose: slip.purpose || '',
                    startTime: new Date(slip.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    endTime: new Date(slip.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    destination: slip.destination || ''
                })
            }
        }
        
        for (const overtime of overtimeRanges) {
            if (dateStr >= overtime.startStr && dateStr <= overtime.endStr) {
                details.push({
                    type: 'Overtime',
                    purpose: overtime.purpose || '',
                    startTime: new Date(overtime.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    endTime: new Date(overtime.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                })
            }
        }
        
        for (const travelOrder of travelOrderRanges) {
            if (dateStr >= travelOrder.startStr && dateStr <= travelOrder.endStr) {
                const start = new Date(travelOrder.startDate)
                const end = new Date(travelOrder.endDate)
                const formattedStartDate = start.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                const formattedEndDate = end.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                
                details.push({
                    type: 'Travel Order',
                    purpose: travelOrder.purpose || '',
                    startDate: formattedStartDate,
                    endDate: formattedEndDate,
                    destination: travelOrder.destination || ''
                })
            }
        }
        
        return details
    }

    function isSpecialStatus(status: string): boolean {
        const specialStatuses = [
            'Vacation Leave', 
            'Sick Leave', 
            'Personal Calamity', 
            'Overtime', 
            'Travel Order'
        ]
        return specialStatuses.includes(status)
    }

    async function fetchAllDTRRecords(month: string, forceRefresh = false) {
        if (isLoadingRef.current) {
            console.log('Fetch already in progress, skipping...')
            return
        }
        
        isLoadingRef.current = true
        setLoading(true)
        
        try {
            if (!forceRefresh) {
                try {
                    const cached = sessionStorage.getItem(CACHE_KEY)
                    if (cached) {
                        const { data, timestamp, month: cachedMonth } = JSON.parse(cached)
                        if (cachedMonth === month && Date.now() - timestamp < CACHE_DURATION) {
                            setDtrRecords(data)
                            setLoading(false)
                            isLoadingRef.current = false
                            return
                        }
                    }
                } catch (e) {
                    // Cache parse error, continue to fetch
                }
            }
            
            const cosEmployees = employees.filter(emp => emp.role === 'cos' || emp.role === 'COS-JO')
            console.log(`📊 Processing ${cosEmployees.length} COS-JO employees`)
            
            if (cosEmployees.length === 0) {
                console.log('⚠️ No COS-JO employees found')
                setDtrRecords([])
                setLoading(false)
                isLoadingRef.current = false
                return
            }
            
            const dtrPromises = cosEmployees.map(async (employee) => {
                try {
                    const response = await axios.get(`/api/dtr/${employee.id}`)
                    const records = response.data.data || []
                    console.log(`📋 DTR records for ${employee.name}: ${records.length} records`)
                    if (records.length > 0) {
                        console.log(`📋 First record sample:`, records[0])
                    }
                    return { employee, records }
                } catch (error) {
                    console.log(`❌ Error fetching DTR records for ${employee.name}:`, error)
                    return { employee, records: [] }
                }
            })
            
            const dtrResults = await Promise.all(dtrPromises)
            
            const requestsPromises = cosEmployees.map(async (employee) => {
                const [passSlips, overtimes, travelOrders] = await Promise.all([
                    fetchPassSlips(employee.id),
                    fetchOvertimeRequests(employee.id),
                    fetchTravelOrderRequests(employee.id)
                ])
                console.log(`📋 Requests for ${employee.name}: ${passSlips.length} pass slips, ${overtimes.length} overtimes, ${travelOrders.length} travel orders`)
                return { employee, passSlips, overtimes, travelOrders }
            })
            
            const requestResults = await Promise.all(requestsPromises)
            
            const allRecords: DTRRecord[] = []
            
            for (const employeeData of requestResults) {
                const { employee, passSlips, overtimes, travelOrders } = employeeData
                const dtrResult = dtrResults.find(r => r.employee.id === employee.id)
                const records = dtrResult?.records || []
                
                console.log(`🔍 Filtering records for ${employee.name} with month: ${month}`)
                
                const monthRecords = records.filter((record: any) => {
                    const recordMonth = record.date?.substring(0, 7)
                    return recordMonth === month
                })
                
                console.log(`📊 ${employee.name}: ${monthRecords.length} records in ${month}`)
                
                for (const record of monthRecords) {
                    const leaveDetails = getLeaveDetailsForDateOptimized(record.date, passSlips, overtimes, travelOrders)
                    let displayStatus = record.status || 'Present'
                    
                    if (leaveDetails.length > 0) {
                        let foundStatus = false
                        
                        for (const detail of leaveDetails) {
                            if (detail.type === 'Overtime') {
                                displayStatus = 'Overtime'
                                foundStatus = true
                                break
                            } else if (detail.type === 'Travel Order') {
                                displayStatus = 'Travel Order'
                                foundStatus = true
                                break
                            } else {
                                const mappedStatus = mapPassSlipTypeToStatus(detail.type)
                                if (mappedStatus) {
                                    displayStatus = mappedStatus
                                    foundStatus = true
                                    break
                                }
                            }
                        }
                        
                        if (!foundStatus && leaveDetails.length > 0) {
                            const firstType = leaveDetails[0]?.type
                            const mappedStatus = mapPassSlipTypeToStatus(firstType)
                            if (mappedStatus) {
                                displayStatus = mappedStatus
                            } else if (firstType === 'Overtime') {
                                displayStatus = 'Overtime'
                            } else if (firstType === 'Travel Order') {
                                displayStatus = 'Travel Order'
                            }
                        }
                    }
                    
                    const date = new Date(record.date)
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6
                    
                    if (isWeekend && !record.timeInAM && !record.timeInPM && record.status !== 'Leave') {
                        displayStatus = 'Weekend'
                    }
                    
                    if (!record.timeInAM && !record.timeOutAM && !record.timeInPM && !record.timeOutPM && 
                        displayStatus === 'Present' && !isWeekend) {
                        displayStatus = 'Absent'
                    }
                    
                    if ((record.timeInAM || record.timeOutAM || record.timeInPM || record.timeOutPM) && 
                        displayStatus === 'Leave' && leaveDetails.length === 0) {
                        displayStatus = 'Present'
                    }
                    
                    allRecords.push({
                        id: record.id || '',
                        employeeId: employee.employeeId,
                        employeeName: employee.name,
                        date: record.date || '',
                        timeInAM: record.timeInAM ? formatTimeTo12Hour(record.timeInAM) : '',
                        timeOutAM: record.timeOutAM ? formatTimeTo12Hour(record.timeOutAM) : '',
                        timeInPM: record.timeInPM ? formatTimeTo12Hour(record.timeInPM) : '',
                        timeOutPM: record.timeOutPM ? formatTimeTo12Hour(record.timeOutPM) : '',
                        totalHours: calculateDayTotal(
                            record.timeInAM || '', 
                            record.timeOutAM || '', 
                            record.timeInPM || '', 
                            record.timeOutPM || ''
                        ),
                        status: displayStatus,
                        locationInAM: record.locationInAM || '',
                        locationOutAM: record.locationOutAM || '',
                        locationInPM: record.locationInPM || '',
                        locationOutPM: record.locationOutPM || '',
                        leaveDetails: leaveDetails.length > 0 ? leaveDetails : []
                    })
                }
            }
            
            console.log(`✅ Total DTR records loaded: ${allRecords.length}`)
            allRecords.sort((a, b) => b.date.localeCompare(a.date))
            setDtrRecords(allRecords)
            
            try {
                sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                    data: allRecords,
                    month: month,
                    timestamp: Date.now()
                }))
            } catch (e) {
                // Cache storage error, ignore
            }
            
        } catch (error) {
            console.error('Error fetching DTR records:', error)
            setDtrRecords([])
        } finally {
            setLoading(false)
            isLoadingRef.current = false
        }
    }

// ✅ Keep your existing getAdminAndSubUsers function as-is
async function getAdminAndSubUsers() {
    try {
        // Try the public users endpoint first
        const response = await axios.get('/api/users')
        const users = response.data.data || []
        
        let adminUser = null
        let subUser = null
        
        for (const user of users) {
            if (user.role === 'admin' || user.role === 'Admin' || user.role === 'super_admin') {
                adminUser = {
                    name: user.profile?.name || user.username || 'Admin',
                    designation: user.profile?.designation || 'Admin'
                }
            }
            if (user.role === 'sub' || user.role === 'Sub' || user.role === 'provincial-director') {
                subUser = {
                    name: user.profile?.name || user.username || 'Provincial Director',
                    designation: user.profile?.designation || 'Provincial Trade and Industry Officer'
                }
            }
        }
        
        console.log('📋 Admin user found:', adminUser)
        console.log('📋 Provincial Director found:', subUser)
        
        return { adminUser, subUser }
    } catch (error: any) {
        console.error('Error fetching from /api/users:', error.message)
        
        // If /api/users fails, try to get from the admin endpoint (if user is admin)
        try {
            const response = await axios.get('/api/admin/employees')
            const users = response.data.data || []
            
            let adminUser = null
            let subUser = null
            
            for (const user of users) {
                if (user.role === 'admin' || user.role === 'Admin' || user.role === 'super_admin') {
                    adminUser = {
                        name: user.profile?.name || user.username || 'Admin',
                        designation: user.profile?.designation || 'Admin'
                    }
                }
                if (user.role === 'sub' || user.role === 'Sub' || user.role === 'provincial-director') {
                    subUser = {
                        name: user.profile?.name || user.username || 'Provincial Director',
                        designation: user.profile?.designation || 'Provincial Trade and Industry Officer'
                    }
                }
            }
            
            return { adminUser, subUser }
        } catch (adminError: any) {
            console.error('Error fetching from admin endpoint:', adminError.message)
            // Final fallback - return default values
            return {
                adminUser: { 
                    name: 'Admin', 
                    designation: 'Admin' 
                },
                subUser: { 
                    name: 'Provincial Director', 
                    designation: 'Provincial Trade and Industry Officer' 
                }
            }
        }
    }
}

async function generateDTRPDF() {
    // Get admin and sub users
    const { adminUser, subUser } = await getAdminAndSubUsers()
    
    console.log('🔵 generateDTRPDF called!')
    console.log('📅 selectedMonth:', selectedMonth)
    console.log('📋 dtrRecords count:', dtrRecords.length)
    
    if (dtrRecords.length === 0) {
        setMessage('⚠️ No DTR records to print')
        return
    }
    
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = 210
    const margin = 15
    let yPos = 15

    // ✅ Get employee data from the DTR records (not from session)
    const firstRecord = dtrRecords[0]
    const userName = firstRecord?.employeeName || 'Employee'
    
    // ✅ Get designation from employees array
    const employeeData = employees.find(emp => emp.name === userName)
    const position = employeeData?.designation || 'COS-JO'
    
    const monthDisplay = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })

    const [year, monthNum] = selectedMonth.split('-').map(Number)
    const daysInMonth = new Date(year, monthNum, 0).getDate()

    // Helper functions
    const addUnderlinedText = (text: string, x: number, y: number) => {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        const textWidth = doc.getTextWidth(text)
        doc.text(text, x, y)
        doc.line(x, y + 0.5, x + textWidth, y + 0.5)
    }

    const addText = (text: string, x: number, y: number, align: 'left' | 'center' | 'right' = 'left', fontSize = 10, bold = false) => {
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', bold ? 'bold' : 'normal')
        doc.text(text, x, y, { align })
    }

    // ✅ Helper to truncate long locations
    const truncateLocation = (location: string, maxLength: number = 12) => {
        if (!location) return ''
        return location.length > maxLength ? location.substring(0, maxLength) + '...' : location
    }

    // ✅ Helper to format time with location
    const formatWithLocation = (time: string, location: string) => {
        if (!time && !location) return ''
        if (time && !location) return time
        if (!time && location) return `${truncateLocation(location)}`
        return `${time}\n${truncateLocation(location)}`
    }

    addText('Name:', margin, yPos, 'left', 10, false)
    addUnderlinedText(userName, margin + 22, yPos)
    yPos += 5

    addText('Position:', margin, yPos, 'left', 10, false)
    addUnderlinedText(position, margin + 29, yPos)
    yPos += 5

    addText('For the Month of:', margin, yPos, 'left', 10, false)
    addUnderlinedText(monthDisplay, margin + 42, yPos)
    yPos += 5

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Official Hours for Regular Days:', margin, yPos)
    const regularTextWidth = doc.getTextWidth('Official Hours for Regular Days:')
    doc.setFont('helvetica', 'bold')
    doc.text(' No flexi time', margin + regularTextWidth, yPos)
    yPos += 6

    // ✅ Calculate stats from records (same format as COS-JOS)
    let tardiness = 0, undertime = 0, overtime = 0, sickLeave = 0, vacationLeave = 0, personalCalamity = 0

    dtrRecords.forEach(record => {
        if (record.status === 'Tardiness') tardiness++
        else if (record.status === 'Undertime') undertime++
        else if (record.status === 'Overtime') overtime++
        else if (record.status === 'Sick Leave') sickLeave++
        else if (record.status === 'Vacation Leave') vacationLeave++
        else if (record.status === 'Personal Calamity') personalCalamity++
    })

    const statsText = `T: ${tardiness}  U: ${undertime}  OT: ${overtime}  PC: ${personalCalamity}  SL: ${sickLeave}  VL: ${vacationLeave}`
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(statsText, margin, yPos)
    yPos += 4

    // ✅ TABLE - Generate ALL days with locations
    const tableData = []
    const recordsByDate: Record<string, DTRRecord[]> = {}
    
    dtrRecords.forEach(record => {
        if (!recordsByDate[record.date]) {
            recordsByDate[record.date] = []
        }
        recordsByDate[record.date].push(record)
    })

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const records = recordsByDate[dateStr] || []
        
        let timeInAM = ''
        let timeOutAM = ''
        let timeInPM = ''
        let timeOutPM = ''
        let locInAM = ''
        let locOutAM = ''
        let locInPM = ''
        let locOutPM = ''
        let remarks = ''

        const date = new Date(year, monthNum - 1, day)
        const isWeekend = date.getDay() === 0 || date.getDay() === 6
        
        if (isWeekend) {
            remarks = date.getDay() === 0 ? 'Sunday' : 'Saturday'
        }

        if (records.length > 0) {
            const record = records[0]
            timeInAM = record.timeInAM || ''
            timeOutAM = record.timeOutAM || ''
            timeInPM = record.timeInPM || ''
            timeOutPM = record.timeOutPM || ''
            
            locInAM = record.locationInAM || ''
            locOutAM = record.locationOutAM || ''
            locInPM = record.locationInPM || ''
            locOutPM = record.locationOutPM || ''
            
            if (record.leaveDetails && record.leaveDetails.length > 0) {
                const remarksList = []
                for (const detail of record.leaveDetails) {
                    let typeDisplay = ''
                    if (detail.type === 'Personal') typeDisplay = 'Personal Calamity'
                    else if (detail.type === 'Emergency') typeDisplay = 'Sick Leave'
                    else if (detail.type === 'Official') typeDisplay = 'Vacation Leave'
                    else if (detail.type === 'Overtime') typeDisplay = 'Overtime'
                    else if (detail.type === 'Travel Order') typeDisplay = 'Travel Order'
                    else typeDisplay = detail.type
                    
                    let remarkText = typeDisplay
                    if (detail.purpose) {
                        remarkText += `: ${detail.purpose}`
                    }
                    if (detail.type === 'Travel Order' && detail.startDate && detail.endDate) {
                        remarkText += ` (${detail.startDate} - ${detail.endDate})`
                    }
                    if (detail.type !== 'Travel Order' && detail.startTime && detail.endTime) {
                        remarkText += ` (${detail.startTime} - ${detail.endTime})`
                    }
                    remarksList.push(remarkText)
                }
                remarks = remarksList.join('; ')
            } else if (record.status && record.status !== 'Present' && !isWeekend) {
                remarks = record.status
            }
            
            // ✅ Use record.status instead of leaveStatus
            if (!remarks && record.status && !isWeekend && record.status !== 'Present') {
                remarks = record.status
            }
        }

        tableData.push([
            String(day).padStart(2, '0'),
            formatWithLocation(timeInAM, locInAM),
            formatWithLocation(timeOutAM, locOutAM),
            formatWithLocation(timeInPM, locInPM),
            formatWithLocation(timeOutPM, locOutPM),
            '', // Overtime In
            '', // Overtime Out
            remarks
        ])
    }

    console.log('📊 Generated', tableData.length, 'rows for the table')

    // ✅ Generate the table with multi-page support (EXACT same as COS-JOS)
    autoTable(doc, {
        startY: yPos,
        head: [
            ['DATE', 'MORNING', '', 'AFTERNOON', '', 'OVERTIME', '', 'REMARKS'],
            ['', 'IN', 'OUT', 'IN', 'OUT', 'IN', 'OUT', '']
        ],
        body: tableData,
        theme: 'grid',
        pageBreak: 'auto',
        styles: {
            fontSize: 7,
            cellPadding: 1,
            halign: 'center',
            valign: 'middle',
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            textColor: [0, 0, 0],
        },
        headStyles: {
            fillColor: [230, 230, 230],
            textColor: [0, 0, 0],
            fontSize: 7,
            fontStyle: 'bold',
            halign: 'center',
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            cellPadding: 1,
        },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 20, halign: 'center' },
            5: { cellWidth: 16, halign: 'center' },
            6: { cellWidth: 16, halign: 'center' },
            7: { cellWidth: 'auto', halign: 'left' },
        },
        didParseCell: function(data: any) {
            if (data.section === 'head' && data.row.index === 0) {
                if (data.column.index === 1) {
                    data.cell.colSpan = 2
                    data.cell.text = ['MORNING']
                    data.cell.styles.halign = 'center'
                }
                if (data.column.index === 3) {
                    data.cell.colSpan = 2
                    data.cell.text = ['AFTERNOON']
                    data.cell.styles.halign = 'center'
                }
                if (data.column.index === 5) {
                    data.cell.colSpan = 2
                    data.cell.text = ['OVERTIME']
                    data.cell.styles.halign = 'center'
                }
            }
        },
        didDrawPage: function(data: any) {
            const pageHeight = doc.internal.pageSize.height
            const pageWidth = 210
            const pageNumber = doc.internal.pages.length - 1
            
            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
        }
    })

    const finalY = (doc as any).lastAutoTable.finalY || yPos - 100

    // ✅ FOOTER - EXACT same as COS-JOS
    let footerY = finalY + 5
    const lineSpacing = 4
    const pageHeight = doc.internal.pageSize.height
    const footerHeight = 70

    if (footerY + footerHeight > pageHeight - 15) {
        doc.addPage()
        footerY = 20
    }

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('I CERTIFY on my honor that the above is true and correct report on the hours of work performed, record of which was made daily', margin, footerY)
    footerY += lineSpacing
    doc.text('at the time of arrival and departure.', margin, footerY)
    footerY += 12

    doc.setFont('helvetica', 'bold')
    doc.text(userName, margin, footerY)
    doc.setFont('helvetica', 'normal')
    doc.text('Employee', margin, footerY + 4)
    const empNameWidth = doc.getTextWidth(userName)
    doc.line(margin, footerY + 0.5, margin + empNameWidth, footerY + 0.5)
    footerY += 20

    doc.setFont('helvetica', 'normal')
    doc.text('Verified as to the prescribed office hours.', margin, footerY)
    const pdLabelX = pageWidth - 80
    doc.text('Noted as to the prescribed office hours.', pdLabelX, footerY)

    footerY += 16

    doc.setFont('helvetica', 'bold')
    const adminName = adminUser?.name || 'Admin'
    doc.text(adminName, margin, footerY)
    doc.setFont('helvetica', 'normal')
    const adminDesignation = adminUser?.designation || 'Admin'
    doc.text(adminDesignation, margin, footerY + 4)
    const adminNameWidth = doc.getTextWidth(adminName)
    doc.line(margin, footerY + 0.5, margin + adminNameWidth, footerY + 0.5)

    const pdX = pageWidth - 80
    doc.setFont('helvetica', 'bold')
    const pdName = subUser?.name || 'Provincial Director'
    doc.text(pdName, pdX, footerY)
    doc.setFont('helvetica', 'normal')
    const pdDesignation = subUser?.designation || 'Provincial Trade and Industry Officer'
    doc.text(pdDesignation, pdX, footerY + 4)
    const pdNameWidth = doc.getTextWidth(pdName)
    doc.line(pdX, footerY + 0.5, pdX + pdNameWidth, footerY + 0.5)

    const totalPages = doc.internal.pages.length - 1
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Page ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })

    const monthStr = selectedMonth.replace('-', '_')
    doc.save(`DTR_${userName}_${monthStr}.pdf`)
}

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    function handleDoubleClick(record: DTRRecord) {
        if (isSpecialStatus(record.status)) {
            return
        }
        setEditingRecord(record.id)
        setEditingStatus(record.status || '')
    }

    async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, record: DTRRecord) {
        if (e.key === 'Enter') {
            e.preventDefault()
            await saveStatus(record)
        } else if (e.key === 'Escape') {
            setEditingRecord(null)
            setEditingStatus('')
        }
    }

    async function handleBlur(record: DTRRecord) {
        if (editingRecord) {
            await saveStatus(record)
        }
    }

    async function saveStatus(record: DTRRecord) {
        if (!editingRecord) return
        
        try {
            const userId = employees.find(emp => emp.employeeId === record.employeeId)?.id
            
            if (!userId) {
                setMessage('❌ Employee not found')
                setEditingRecord(null)
                setEditingStatus('')
                return
            }

            const response = await axios.put(`/api/dtr/update-status/${userId}`, {
                date: record.date,
                status: editingStatus
            })

            if (response.status === 200) {
                setMessage('✅ Status updated successfully')
                const updatedRecords = dtrRecords.map(r => 
                    r.id === record.id ? { ...r, status: editingStatus } : r
                )
                setDtrRecords(updatedRecords)
                sessionStorage.removeItem(CACHE_KEY)
                setEditingRecord(null)
                setEditingStatus('')
                setTimeout(() => setMessage(''), 3000)
            }
        } catch (error: any) {
            console.error('Error updating status:', error)
            setMessage('❌ Error updating status')
            setEditingRecord(null)
            setEditingStatus('')
        }
    }

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const month = e.target.value
        setSelectedMonth(month)
        setCurrentPage(1)
        fetchAllDTRRecords(month, true)
    }

    function getStatusColor(status: string): string {
        switch(status) {
            case 'Present':
                return 'text-green-600'
            case 'Absent':
                return 'text-red-600'
            case 'Vacation Leave':
                return 'text-blue-600'
            case 'Sick Leave':
                return 'text-blue-600'
            case 'Personal Calamity':
                return 'text-blue-600'
            case 'Overtime':
                return 'text-purple-600'
            case 'Travel Order':
                return 'text-orange-600'
            case 'Weekend':
                return 'text-gray-500'
            default:
                return 'text-gray-600'
        }
    }

    function handleStatusClick(record: DTRRecord) {
        if (isSpecialStatus(record.status) && record.leaveDetails && record.leaveDetails.length > 0) {
            setSelectedDetail({
                record: record,
                details: record.leaveDetails
            })
        }
    }

    function closeDetailModal() {
        setSelectedDetail(null)
    }

    const renderStatusCell = useCallback((record: DTRRecord) => {
        if (editingRecord === record.id) {
            return (
                <input
                    ref={inputRef}
                    type="text"
                    value={editingStatus}
                    onChange={(e) => setEditingStatus(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, record)}
                    onBlur={() => handleBlur(record)}
                    className="border border-blue-500 rounded px-1 py-0.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter status..."
                />
            )
        }

        if (isSpecialStatus(record.status) && record.leaveDetails && record.leaveDetails.length > 0) {
            return (
                <span 
                    onClick={() => handleStatusClick(record)}
                    className={`cursor-pointer hover:underline font-medium ${getStatusColor(record.status)}`}
                    title="Click to view details"
                >
                    {record.status}
                </span>
            )
        }

        return (
            <span 
                onDoubleClick={() => handleDoubleClick(record)}
                className={`cursor-pointer hover:underline font-medium ${getStatusColor(record.status)}`}
                title="Double-click to edit status"
            >
                {record.status || 'Click to add status'}
            </span>
        )
    }, [editingRecord, editingStatus])

    const TableRow = useCallback(({ record }: { record: DTRRecord }) => {
        return (
            <tr key={record.id} className='border-t-[1] border-gray-300 hover:bg-gray-50'>
                <td className='pl-5 py-2'>{record.employeeId}</td>
                <td className='pl-5 py-2'>{record.employeeName}</td>
                <td className='pl-5 py-2'>{record.date}</td>
                <td className='pl-5 py-2'>
                    <div className='flex flex-col'>
                        <span>{record.timeInAM || '-'}</span>
                        {record.locationInAM && (
                            <span className='text-[10px] text-gray-400'>{record.locationInAM}</span>
                        )}
                    </div>
                </td>
                <td className='pl-5 py-2'>
                    <div className='flex flex-col'>
                        <span>{record.timeOutAM || '-'}</span>
                        {record.locationOutAM && (
                            <span className='text-[10px] text-gray-400'>{record.locationOutAM}</span>
                        )}
                    </div>
                </td>
                <td className='pl-5 py-2'>
                    <div className='flex flex-col'>
                        <span>{record.timeInPM || '-'}</span>
                        {record.locationInPM && (
                            <span className='text-[10px] text-gray-400'>{record.locationInPM}</span>
                        )}
                    </div>
                </td>
                <td className='pl-5 py-2'>
                    <div className='flex flex-col'>
                        <span>{record.timeOutPM || '-'}</span>
                        {record.locationOutPM && (
                            <span className='text-[10px] text-gray-400'>{record.locationOutPM}</span>
                        )}
                    </div>
                </td>
                <td className='pl-5 py-2 font-medium'>{record.totalHours || '-'}</td>
                <td className='pl-5 py-2'>
                    {renderStatusCell(record)}
                </td>
            </tr>
        )
    }, [renderStatusCell])

    if (loading) {
        return (
            <div className='flex flex-col w-full bg-gray-200'>
                <ContentHeader/>
                <div className='flex flex-col bg-white py-5 my-5 mx-10 rounded-xl border-[1] border-black'>
                    <div className='flex justify-center items-center p-10'>
                        <p className='text-gray-500'>Loading DTR records...</p>
                    </div>
                </div>
            </div>
        )
    }

    return(
        <div className='flex flex-col w-full bg-gray-200'>
            <ContentHeader/>
            <div className='flex flex-col bg-white py-5 my-5 mx-10 rounded-xl border-[1] border-black'>
                <div className='flex justify-between items-center px-5 pb-3 border-b border-gray-200'>
                    <div className='flex items-center gap-4'>
                        <p className='font-bold text-xl'>Manage DTR</p>
                        <input 
                            type='month' 
                            value={selectedMonth}
                            onChange={handleMonthChange}
                            className='border border-gray-300 rounded-lg px-3 py-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                        />
                    </div>
                    <div className='flex items-center gap-4'>
                        <div className='flex items-center gap-2'>
                            <select
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                                className='border border-gray-300 rounded-lg px-3 py-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                            >
                                <option value="all">All Employees</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.employeeId}>
                                        {emp.name} ({emp.employeeId})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className='flex items-center gap-2'>
                            <input
                                type='text'
                                placeholder='Search by name or ID...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='border border-gray-300 rounded-lg px-3 py-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm w-48'
                            />
                        </div>
                        <button 
                            onClick={generateDTRPDF}
                            className='flex items-center gap-2 bg-gradient-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)] py-1.5 px-4 rounded-lg text-white cursor-pointer hover:opacity-90 transition-opacity text-sm'
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                <path d="M18 9H6"></path>
                                <path d="M18 13H6"></path>
                                <path d="M18 17H6"></path>
                                <rect x="2" y="9" width="20" height="13" rx="2" ry="2"></rect>
                            </svg>
                            <p className='font-semibold'>Print DTR</p>
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`mx-5 mt-2 p-2 rounded text-sm ${
                        message.includes('✅') 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                        {message}
                    </div>
                )}

                <div className='flex flex-col mb-3 mt-3'>
                    <div className="overflow-x-auto">
                        <table className='w-full text-gray-600 text-sm'>
                            <thead className='bg-gray-200 border-y-2 border-gray-300'>
                                <tr>
                                    <td className='pl-5 py-2 font-bold'>Employee ID</td>
                                    <td className='pl-5 py-2 font-bold'>Name</td>
                                    <td className='pl-5 py-2 font-bold'>Date</td>
                                    <td className='pl-5 py-2 font-bold'>AM In</td>
                                    <td className='pl-5 py-2 font-bold'>AM Out</td>
                                    <td className='pl-5 py-2 font-bold'>PM In</td>
                                    <td className='pl-5 py-2 font-bold'>PM Out</td>
                                    <td className='pl-5 py-2 font-bold'>Total Hours</td>
                                    <td className='pl-5 py-2 font-bold w-40'>Status</td>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className='text-center py-4 text-gray-500'>No DTR records found for this month</td>
                                    </tr>
                                ) : (
                                    currentRecords.map((record) => (
                                        <TableRow key={record.id} record={record} />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className='flex justify-between items-center text-sm font-bold text-gray-600 px-5 mt-2'>
                        <p>Page {currentPage} of {totalPages} ({filteredRecords.length} records)</p>
                        <div className='flex gap-3'>
                            <button 
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`cursor-pointer ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Image src='/arrow-left.svg' width={14} height={14} alt='arrow-left'/>
                            </button>
                            <p>{currentPage}</p>
                            <button 
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`cursor-pointer ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Image src='/arrow-right.svg' width={14} height={14} alt='arrow-right'/>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {selectedDetail && (
                <div 
                    className="fixed inset-0 bg-gray-500/50 flex items-center justify-center z-50" 
                    onClick={closeDetailModal}
                >
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">
                                {selectedDetail.record.status} Details
                            </h3>
                            <button 
                                onClick={closeDetailModal}
                                className="text-gray-500 hover:text-gray-700 text-xl"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="border-t border-gray-200 pt-4">
                            <p className="text-sm text-gray-600 mb-2">
                                <span className="font-semibold">Employee:</span> {selectedDetail.record.employeeName}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                                <span className="font-semibold">Date:</span> {selectedDetail.record.date}
                            </p>
                            {selectedDetail.details.map((detail: any, index: number) => {
                                let displayType = ''
                                if (detail.type === 'Personal') displayType = 'Personal Calamity'
                                else if (detail.type === 'Emergency') displayType = 'Sick Leave'
                                else if (detail.type === 'Official') displayType = 'Vacation Leave'
                                else if (detail.type === 'Overtime') displayType = 'Overtime'
                                else if (detail.type === 'Travel Order') displayType = 'Travel Order'
                                else displayType = detail.type
                                
                                return (
                                    <div key={index} className="bg-gray-50 rounded p-3 mb-3">
                                        <p className="text-sm font-semibold text-gray-800">{displayType}</p>
                                        {detail.purpose && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                <span className="font-medium">Purpose:</span> {detail.purpose}
                                            </p>
                                        )}
                                        {detail.destination && detail.type !== 'Overtime' && (
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Destination:</span> {detail.destination}
                                            </p>
                                        )}
                                        {detail.type === 'Travel Order' && detail.startDate && detail.endDate && (
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Dates:</span> {detail.startDate} - {detail.endDate}
                                            </p>
                                        )}
                                        {(detail.type !== 'Travel Order' && detail.startTime && detail.endTime) && (
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Time:</span> {detail.startTime} - {detail.endTime}
                                            </p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={closeDetailModal}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}