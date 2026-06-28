// components/COS-JOS/Content/DTRContent.tsx
import Image from "next/image"
import ContentHeader from "@/components/ContentHeader"
import { useState, useEffect } from "react"
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
}

interface LeaveRequest {
    id: string
    startDate: string
    endDate: string
    type: string // 'Official', 'Personal', 'Emergency'
    status: string // 'Approved', 'Pending', 'Disapproved'
}

export default function DTRContent({username, userId}: {username: string, userId?: string}) {
    const { data: session } = useSession()
    const [currentTime, setCurrentTime] = useState(new Date())
    const [timeInAM, setTimeInAM] = useState<string | null>(null)
    const [timeOutAM, setTimeOutAM] = useState<string | null>(null)
    const [timeInPM, setTimeInPM] = useState<string | null>(null)
    const [timeOutPM, setTimeOutPM] = useState<string | null>(null)
    const [isTimeInAM, setIsTimeInAM] = useState(false)
    const [isTimeOutAM, setIsTimeOutAM] = useState(false)
    const [isTimeInPM, setIsTimeInPM] = useState(false)
    const [isTimeOutPM, setIsTimeOutPM] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [dtrRecords, setDtrRecords] = useState<DTRRecord[]>([])
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
    const [selectedMonth, setSelectedMonth] = useState('')
    const [stats, setStats] = useState({
        tardiness: '0',
        undertime: '0',
        overtime: '0',
        sickLeave: '0',
        vacationLeave: '0',
        personalCalamity: '0'
    })
    const [hasTodayRecord, setHasTodayRecord] = useState(false)

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

    // ✅ Load both leave requests and DTR records sequentially
    async function loadData(month: string) {
        const approvedLeaves = await fetchLeaveRequests()
        await fetchDTRRecords(month, approvedLeaves)
    }

    // ✅ Session detection - available from 7:00 AM to 6:00 PM
    const getCurrentSession = () => {
        const hour = currentTime.getHours()
        if (hour >= 7 && hour < 12) return 'morning'
        else if (hour >= 12 && hour < 18) return 'afternoon'
        return null
    }

    const isTimeAllowed = () => {
        const hour = currentTime.getHours()
        return hour >= 7 && hour < 18
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

    // ✅ Fetch ALL approved pass slips (not filtered by month)
    async function fetchLeaveRequests() {
        if (!session?.user?.id) return []
        
        try {
            console.log('🔍 Fetching pass slips for user:', session.user.id)
            const response = await axios.get(`/api/pass_slip/${session.user.id}`)
            const records = response.data.data || []
            console.log('📋 All pass slips received:', records.length)
            
            // Filter only APPROVED pass slips (all months)
            const approvedLeaves = records.filter((record: any) => {
                return record.status === 'Approved'
            })
            
            console.log('✅ Approved pass slips:', approvedLeaves.length)
            console.log('📝 Approved pass slips details:', approvedLeaves.map((l: any) => ({
                type: l.type,
                startDate: l.startDate,
                endDate: l.endDate,
                status: l.status
            })))
            
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

    // ✅ Calculate statistics from DTR records with leave data
    function calculateRealStats(records: DTRRecord[]) {
        let tardiness = 0
        let undertime = 0
        let overtime = 0
        let sickLeave = 0
        let vacationLeave = 0
        let personalCalamity = 0

        console.log('📊 Calculating stats from records:', records.length)

        records.forEach(record => {
            // First, check for leave statuses
            if (record.status === 'Sick Leave') {
                sickLeave++
                console.log('💚 Found Sick Leave on:', record.date)
            } else if (record.status === 'Vacation Leave') {
                vacationLeave++
                console.log('💙 Found Vacation Leave on:', record.date)
            } else if (record.status === 'Personal Calamity') {
                personalCalamity++
                console.log('💜 Found Personal Calamity on:', record.date)
            }
            
            // ✅ ALWAYS calculate tardiness, undertime, and overtime regardless of leave status
            // Calculate total hours
            const totalHours = record.totalHours
            if (totalHours && totalHours !== '-') {
                const [hours, minutes] = totalHours.split(':').map(Number)
                const totalMinutes = (hours || 0) * 60 + (minutes || 0)
                
                // Standard work hours: 8 hours (480 minutes)
                if (totalMinutes > 0) {
                    if (totalMinutes < 480) {
                        undertime++
                    } else if (totalMinutes > 480) {
                        overtime++
                    }
                }
            }
            
            // ✅ Auto-calculate tardiness (time-in > 7:00 AM)
            // 7:00 AM = 420 minutes
            if (record.timeInAM) {
                const [inHours, inMinutes] = record.timeInAM.split(':').map(Number)
                const timeInMinutes = inHours * 60 + inMinutes
                if (timeInMinutes > 420) {
                    tardiness++
                }
            }
        })

        console.log('📊 Final stats from DTR:', {
            tardiness,
            undertime,
            overtime,
            sickLeave,
            vacationLeave,
            personalCalamity
        })

        return { tardiness, undertime, overtime, sickLeave, vacationLeave, personalCalamity }
    }

    // ✅ Check if a date has an approved pass slip and map to DTR status
    function getLeaveStatusForDate(dateStr: string, leaves: LeaveRequest[]): string | null {
        const date = new Date(dateStr)
        const dateString = date.toISOString().split('T')[0]
        
        console.log(`🔎 Checking date: ${dateString} against ${leaves.length} leave requests`)
        
        for (const leave of leaves) {
            const startDate = new Date(leave.startDate).toISOString().split('T')[0]
            const endDate = new Date(leave.endDate).toISOString().split('T')[0]
            
            if (dateString >= startDate && dateString <= endDate) {
                // ✅ Map Pass Slip type to DTR status
                const status = mapPassSlipTypeToStatus(leave.type)
                console.log(`✅ Match found! Date: ${dateString}, Type: ${leave.type} → Status: ${status}`)
                if (status) {
                    return status
                }
            }
        }
        return null
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

    async function fetchDTRRecords(month: string, leaves: LeaveRequest[] = []) {
        if (!session?.user?.id) return
        
        try {
            console.log('📅 Fetching DTR records for month:', month)
            console.log('📋 Passed leaves count:', leaves.length)
            const response = await axios.get(`/api/dtr/${session.user.id}`)
            const records = response.data.data || []
            
            const filtered = records.filter((record: any) => 
                record.date?.startsWith(month)
            )
            
            console.log('📋 DTR records found:', filtered.length)
            
            const formattedRecords: DTRRecord[] = filtered.map((record: any) => {
                // ✅ Check if this date has an approved pass slip using the passed leaves
                const leaveStatus = getLeaveStatusForDate(record.date, leaves)
                
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
                    // ✅ Override status if there's an approved pass slip
                    status: leaveStatus || record.status || 'Present'
                }
                
                if (leaveStatus) {
                    console.log(`📌 Record ${record.date}: Status set to "${leaveStatus}" (was "${record.status || 'Present'}")`)
                }
                
                return formatted
            })
            
            setDtrRecords(formattedRecords)
            
            // ✅ Calculate stats from DTR records
            const dtrStats = calculateRealStats(formattedRecords)
            
            // ✅ Count leaves from requests (including those without DTR records)
            const leaveCounts = countLeavesFromRequests(leaves, month)
            console.log('📊 Leaves from requests:', leaveCounts)
            
            // Count how many leaves were already counted from DTR records
            let dtrSickLeave = 0
            let dtrVacationLeave = 0
            let dtrPersonalCalamity = 0
            
            formattedRecords.forEach(record => {
                if (record.status === 'Sick Leave') dtrSickLeave++
                else if (record.status === 'Vacation Leave') dtrVacationLeave++
                else if (record.status === 'Personal Calamity') dtrPersonalCalamity++
            })
            
            // Add only the leaves that weren't already counted in DTR
            const additionalSickLeave = Math.max(0, leaveCounts.sickLeave - dtrSickLeave)
            const additionalVacationLeave = Math.max(0, leaveCounts.vacationLeave - dtrVacationLeave)
            const additionalPersonalCalamity = Math.max(0, leaveCounts.personalCalamity - dtrPersonalCalamity)
            
            const finalStats = {
                tardiness: dtrStats.tardiness.toString(),
                undertime: dtrStats.undertime.toString(),
                overtime: dtrStats.overtime.toString(),
                sickLeave: (dtrStats.sickLeave + additionalSickLeave).toString(),
                vacationLeave: (dtrStats.vacationLeave + additionalVacationLeave).toString(),
                personalCalamity: (dtrStats.personalCalamity + additionalPersonalCalamity).toString()
            }
            
            console.log('📊 Final combined stats:', finalStats)
            setStats(finalStats)
            
        } catch (error: any) {
            if (error.response?.status !== 404) {
                console.error('Error fetching DTR records:', error)
            }
            setDtrRecords([])
        }
    }

    function getDaysInMonth(year: number, month: number) {
        return new Date(year, month + 1, 0).getDate()
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
            if (record) {
                totalHours = record.totalHours || '-'
                status = record.status || 'Present'
            }
            
            days.push({
                date: dateStr,
                day: day,
                record: record || null,
                totalHours: totalHours,
                status: status,
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
            setMessage('Time-in is only available from 7:00 AM to 6:00 PM')
            return
        }

        const sessionType = getCurrentSession()
        if (!sessionType) {
            setMessage('Time-in is only available from 7:00 AM to 6:00 PM')
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
            
            const payload: any = {
                date: dateString,
                session: sessionType
            }
            
            if (sessionType === 'morning') {
                payload.timeInAM = timeString
            } else {
                payload.timeInPM = timeString
            }
            
            const response = await axios.post(`/api/dtr/${session.user.id}`, payload)

            if (response.status === 200 || response.status === 201) {
                if (sessionType === 'morning') {
                    setIsTimeInAM(true)
                    setTimeInAM(timeString)
                } else {
                    setIsTimeInPM(true)
                    setTimeInPM(timeString)
                }
                setMessage(`Time-in recorded (${sessionType})`)
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
            setMessage('Time-out is only available from 7:00 AM to 6:00 PM')
            return
        }

        const sessionType = getCurrentSession()
        if (!sessionType) {
            setMessage('Time-out is only available from 7:00 AM to 6:00 PM')
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
            
            const payload: any = {
                date: dateString,
                session: sessionType
            }
            
            if (sessionType === 'morning') {
                payload.timeOutAM = timeString
            } else {
                payload.timeOutPM = timeString
            }
            
            const response = await axios.put(`/api/dtr/${session.user.id}`, payload)

            if (response.status === 200) {
                if (sessionType === 'morning') {
                    setIsTimeOutAM(true)
                    setTimeOutAM(timeString)
                } else {
                    setIsTimeOutPM(true)
                    setTimeOutPM(timeString)
                }
                setMessage(`Time-out recorded (${sessionType})`)
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
                            {isTimeInAM && !isTimeOutAM ? '' : isTimeOutAM ? '' : ''}
                        </span>
                        <span className={`text-sm font-semibold ${isAfternoonSession ? 'text-orange-600' : 'text-gray-400'}`}>
                            Afternoon
                            {isTimeInPM && !isTimeOutPM ? '' : isTimeOutPM ? '' : ''}
                        </span>
                    </div>

                    {!timeAllowed && (
                        <p className='text-xs text-red-500 mt-1'>Time-in/out available from 7:00 AM to 6:00 PM</p>
                    )}

                    {message && (
                        <p className={`text-sm font-semibold ${message.includes('✅') ? 'text-green-600' : message.includes('❌') ? 'text-red-600' : 'text-blue-600'}`}>
                            {message}
                        </p>
                    )}

                    <div className='flex gap-2 mt-2'>
                        <input 
                            className={`font-semibold text-white px-6 py-1 rounded-lg cursor-pointer transition-colors disabled:opacity-50 ${
                                isTimeInDisabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                            }`}
                            type='button' 
                            value='Time In'
                            onClick={handleTimeIn}
                            disabled={isTimeInDisabled}
                        />
                        <input 
                            className={`font-semibold text-white px-6 py-1 rounded-lg cursor-pointer transition-colors disabled:opacity-50 ${
                                isTimeOutDisabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                            }`}
                            type='button' 
                            value='Time Out'
                            onClick={handleTimeOut}
                            disabled={isTimeOutDisabled}
                        />
                    </div>
                </div>
                
                <div className='flex bg-white items-center justify-evenly my-5 mr-10 flex-1 rounded-xl border border-black'>
                    <div className='flex flex-col gap-5'>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Tardiness</p>
                            <p className='text-3xl'>{stats.tardiness}</p>
                        </div>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Undertime</p>
                            <p className='text-3xl'>{stats.undertime}</p>
                        </div>
                    </div>
                    <div className='flex flex-col gap-5'>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Personal Calamity</p>
                            <p className='text-3xl'>{stats.personalCalamity}</p>
                        </div>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Overtime</p>
                            <p className='text-3xl'>{stats.overtime}</p>
                        </div>
                    </div>
                    <div className='flex flex-col gap-5'>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Sick Leave</p>
                            <p className='text-3xl'>{stats.sickLeave}</p>
                        </div>
                        <div className='flex flex-col items-center'>
                            <p className='font-bold text-[rgba(0,20,121,1)]'>Vacation Leave</p>
                            <p className='text-3xl'>{stats.vacationLeave}</p>
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
                                            {dayData.record?.timeInAM || '-'}
                                        </td>
                                        <td className='border-r border-gray-400'>
                                            {dayData.record?.timeOutAM || '-'}
                                        </td>
                                        <td className='border-r border-gray-400'>
                                            {dayData.record?.timeInPM || '-'}
                                        </td>
                                        <td className='border-r border-gray-400'>
                                            {dayData.record?.timeOutPM || '-'}
                                        </td>
                                        <td className='border-r border-gray-400 font-medium'>
                                            {dayData.totalHours}
                                        </td>
                                        <td>
                                            {dayData.isFuture ? '-' : (dayData.isWeekend ? 'Weekend' : (dayData.status || 'Absent'))}
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