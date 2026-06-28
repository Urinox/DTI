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
        fetchDTRRecords(month)
    }, [])

    useEffect(() => {
        if (session?.user?.id) {
            checkTodayRecord()
        }
    }, [session])

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

    // ✅ Calculate statistics from DTR records
    function calculateRealStats(records: DTRRecord[]) {
        let tardiness = 0
        let undertime = 0
        let overtime = 0
        let sickLeave = 0
        let vacationLeave = 0
        let personalCalamity = 0

        records.forEach(record => {
            // Check status from the record
            if (record.status === 'Tardy') {
                tardiness++
            } else if (record.status === 'Undertime') {
                undertime++
            } else if (record.status === 'Overtime') {
                overtime++
            } else if (record.status === 'Sick Leave') {
                sickLeave++
            } else if (record.status === 'Vacation Leave') {
                vacationLeave++
            } else if (record.status === 'Personal Calamity') {
                personalCalamity++
            } else {
                // Calculate based on time data if no explicit status
                const totalHours = record.totalHours
                if (totalHours && totalHours !== '-') {
                    const [hours, minutes] = totalHours.split(':').map(Number)
                    const totalMinutes = (hours || 0) * 60 + (minutes || 0)
                    
                    // Standard work hours: 8 hours (480 minutes)
                    if (totalMinutes < 480 && totalMinutes > 0) {
                        undertime++
                    } else if (totalMinutes > 480) {
                        overtime++
                    }
                }
            }
        })

        setStats({
            tardiness: tardiness.toString(),
            undertime: undertime.toString(),
            overtime: overtime.toString(),
            sickLeave: sickLeave.toString(),
            vacationLeave: vacationLeave.toString(),
            personalCalamity: personalCalamity.toString()
        })
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
            setTimeInPM(null)
            setTimeOutPM(null)
            setIsTimeInAM(false)
            setIsTimeOutAM(false)
            setIsTimeInPM(false)
            setIsTimeOutPM(false)
            setHasTodayRecord(false)
        }
    }

    async function fetchDTRRecords(month: string) {
        if (!session?.user?.id) return
        
        try {
            const response = await axios.get(`/api/dtr/${session.user.id}`)
            const records = response.data.data || []
            
            const filtered = records.filter((record: any) => 
                record.date?.startsWith(month)
            )
            
            const formattedRecords: DTRRecord[] = filtered.map((record: any) => ({
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
                status: record.status || 'Present'
            }))
            
            setDtrRecords(formattedRecords)
            // ✅ Calculate real statistics from records
            calculateRealStats(formattedRecords)
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
                await fetchDTRRecords(selectedMonth)
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
                await fetchDTRRecords(selectedMonth)
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
        fetchDTRRecords(month)
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
            <ContentHeader username={username} userId={userId} />
            
            <div className='flex'>
                <div className='flex flex-col bg-white items-center justify-center my-5 mx-10 px-10 py-5 gap-2 border border-black rounded-xl'>
                    <Image src='/face.png' width={80} height={80} alt='face'/>
                    <p className='font-bold text-2xl'>{formattedTime}</p>
                    <p className='text-sm text-gray-500'>{formattedDate}</p>
                    
                    <div className='flex gap-4 mt-1'>
                        <span className={`text-sm font-semibold ${isMorningSession ? 'text-green-600' : 'text-gray-400'}`}>
                            Morning
                            {isTimeInAM && !isTimeOutAM && ' (In)'}
                            {isTimeOutAM && ' (Out)'}
                        </span>
                        <span className={`text-sm font-semibold ${isAfternoonSession ? 'text-orange-600' : 'text-gray-400'}`}>
                            Afternoon
                            {isTimeInPM && !isTimeOutPM && ' (In)'}
                            {isTimeOutPM && ' (Out)'}
                        </span>
                    </div>

                    {!timeAllowed && (
                        <p className='text-xs text-red-500 mt-1'>Time-in/out available from 7:00 AM to 6:00 PM</p>
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