// components/COS-JOS/Cards/OvertimeCard.tsx
import Image from "next/image"
import { useState, useEffect } from "react"

interface OvertimeInfo {
    id?: string
    startDate: string,
    endDate: string,
    purpose: string,
    status: string,
    hours?: string
}

export default function OvertimeCard({info} : {info: OvertimeInfo}) {
    const [startDate, setStartDate] = useState('')
    const [startDay, setStartDay] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')

    function formatStartDate() {
        const date = new Date(info.startDate)
        setStartDate(date.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}))
        setStartDay(date.toLocaleDateString('en-US', {weekday: 'long'}))
        setStartTime(date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}))
    }

    function formatEndDate() {
        const date = new Date(info.endDate)
        setEndTime(date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}))
    }

    useEffect(() => {
        formatStartDate()
        formatEndDate()
    }, []);

    // ✅ Map status for display
    const getDisplayStatus = (status: string) => {
        if (status === 'Approved by Division Head') {
            return 'Pending'
        }
        return status
    }

    const displayStatus = getDisplayStatus(info.status)

    // Get status color
    const getStatusColor = (status: string) => {
        if (displayStatus === 'Approved') {
            return 'border-green-800 text-green-800 bg-[#EBFFD1]'
        }
        if (displayStatus === 'Pending') {
            return 'border-orange-700 text-orange-700 bg-[#FFDECA]'
        }
        if (displayStatus === 'Disapproved') {
            return 'border-[#990202] text-[#990202] bg-[#FFD6D6]'
        }
        return 'border-gray-800 text-gray-800 bg-gray-100'
    }

    // Format hours if present
    const formatHours = (hours: string) => {
        if (!hours) return ''
        const num = parseFloat(hours)
        if (num === 1) return '1 hour'
        return `${num} hours`
    }

    return(
        <div className='flex flex-col border-[2px] border-gray-600 rounded-lg items-center mx-10 py-4 gap-3'>
            <div className='flex justify-between items-center w-full px-5 pb-4 border-b-[1px] border-gray-300'>
                <div className='flex flex-col'>
                    <p className='font-bold'>{startDate} ({startDay})</p>
                    <p className='text-sm text-gray-600'>
                        {startTime} - {endTime}
                    </p>
                    {info.hours && info.hours !== '0' && (
                        <p className='text-sm text-blue-600 mt-1'>{formatHours(info.hours)}</p>
                    )}
                </div>
                <div className='flex items-center gap-3'>
                    <p className={`border-2 rounded-lg font-bold px-5 py-1 text-sm ${getStatusColor(info.status)}`}>
                        {displayStatus}
                    </p>
                    <button className='flex text-white rounded-lg px-5 py-1 gap-2 cursor-pointer font-semibold bg-linear-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)]'>
                        <Image src='/print.svg' width={16} height={16} alt='print'/>
                        <p>Print</p>
                    </button>
                </div>
            </div>
            <div className='flex flex-col w-full px-5'>
                <p className='font-bold text-sm'>Purpose</p>
                <p className='text-gray-600 text-sm'>{info.purpose}</p>
            </div>
        </div>
    )
}