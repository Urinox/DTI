// components/Admin/Content/DTRManagerContent.tsx
import ContentHeader from "@/components/ContentHeader"
import Image from "next/image"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useSession } from "next-auth/react"
import axios from "axios"

interface Employee {
    id: string
    employeeId: string
    username: string
    name: string
    email: string
    designation: string
    division: string
    office: string
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

    async function fetchEmployees() {
        try {
            if (!session?.user?.id) return
            
            const response = await axios.get('/api/admin/employees')
            const data = response.data.data || []
            
            const formattedEmployees = data.map((user: any, index: number) => ({
                id: user.id || '',
                employeeId: (index + 1).toString().padStart(5, '0'),
                username: user.username || '',
                name: user.profile?.name || user.username || 'Unknown',
                email: user.email || '',
                designation: user.profile?.designation || 'N/A',
                division: user.profile?.division || '',
                office: user.profile?.office || ''
            }))
            
            setEmployees(formattedEmployees)
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
                    purpose: record.purpose || '',
                    destination: record.destination || ''
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

    // ✅ Optimized: Pre-calculate date ranges once
    function getLeaveDetailsForDateOptimized(
        dateStr: string, 
        passSlips: PassSlip[], 
        overtimes: OvertimeRequest[], 
        travelOrders: TravelOrderRequest[]
    ): any[] {
        const details: any[] = []
        
        // Pre-calculate date ranges
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
        
        // Check using pre-calculated strings
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
                    endTime: new Date(overtime.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    destination: overtime.destination || ''
                })
            }
        }
        
        for (const travelOrder of travelOrderRanges) {
            if (dateStr >= travelOrder.startStr && dateStr <= travelOrder.endStr) {
                details.push({
                    type: 'Travel Order',
                    purpose: travelOrder.purpose || '',
                    startTime: new Date(travelOrder.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    endTime: new Date(travelOrder.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
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

    // ✅ OPTIMIZED: Fetch all data in parallel with caching
    async function fetchAllDTRRecords(month: string, forceRefresh = false) {
        // Prevent concurrent execution
        if (isLoadingRef.current) {
            console.log('Fetch already in progress, skipping...')
            return
        }
        
        isLoadingRef.current = true
        setLoading(true)
        
        try {
            // Check cache
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
            
            // Step 1: Fetch all DTR records in parallel with Promise.allSettled for better error handling
            const dtrPromises = employees.map(employee => 
                axios.get(`/api/dtr/${employee.id}`)
                    .then(response => ({ employee, records: response.data.data || [] }))
                    .catch(() => ({ employee, records: [] }))
            )
            
            const dtrResults = await Promise.all(dtrPromises)
            
            // Step 2: Fetch all requests (pass slips, overtime, travel orders) in parallel
            const requestsPromises = employees.map(async (employee) => {
                const [passSlips, overtimes, travelOrders] = await Promise.all([
                    fetchPassSlips(employee.id),
                    fetchOvertimeRequests(employee.id),
                    fetchTravelOrderRequests(employee.id)
                ])
                return { employee, passSlips, overtimes, travelOrders }
            })
            
            const requestResults = await Promise.all(requestsPromises)
            
            // Step 3: Process all data
            const allRecords: DTRRecord[] = []
            
            for (const employeeData of requestResults) {
                const { employee, passSlips, overtimes, travelOrders } = employeeData
                const dtrResult = dtrResults.find(r => r.employee.id === employee.id)
                const records = dtrResult?.records || []
                
                const monthRecords = records.filter((record: any) => 
                    record.date?.startsWith(month)
                )
                
                // Process each record
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
                        timeInAM: record.timeInAM || '',
                        timeOutAM: record.timeOutAM || '',
                        timeInPM: record.timeInPM || '',
                        timeOutPM: record.timeOutPM || '',
                        totalHours: record.totalHours || '',
                        status: displayStatus,
                        locationInAM: record.locationInAM || '',
                        locationOutAM: record.locationOutAM || '',
                        locationInPM: record.locationInPM || '',
                        locationOutPM: record.locationOutPM || '',
                        leaveDetails: leaveDetails.length > 0 ? leaveDetails : []
                    })
                }
            }
            
            allRecords.sort((a, b) => b.date.localeCompare(a.date))
            setDtrRecords(allRecords)
            
            // Save to cache
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
                // Clear cache on update
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
        fetchAllDTRRecords(month, true) // Force refresh on month change
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

    // ✅ Memoized render function for status cell
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

    // ✅ Memoized table row component
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
                    <p className='font-bold text-xl'>Manage DTR</p>
                    <div className='flex items-center gap-4'>
                        <input 
                            type='month' 
                            value={selectedMonth}
                            onChange={handleMonthChange}
                            className='border border-gray-300 rounded-lg px-3 py-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                        />
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

            {/* Detail Modal */}
            {selectedDetail && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeDetailModal}>
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
                                        {detail.destination && (
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Destination:</span> {detail.destination}
                                            </p>
                                        )}
                                        {(detail.startTime && detail.endTime) && (
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