// components/Provincial Director/Cards/OvertimeCard.tsx
import Image from "next/image"
import { useState, useEffect } from "react"

interface OvertimeCardProps {
    info: {
        id?: string
        date?: string
        startDate?: string
        endDate?: string
        purpose: string
        status: string
        userId?: string
        username?: string
        office?: string
        hours?: string
    }
    onApprove?: () => void
    onDisapprove?: () => void
}

export default function OvertimeCard({ info, onApprove, onDisapprove }: OvertimeCardProps) {
    const [startDate, setStartDate] = useState('')
    const [startDay, setStartDay] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')

    function formatStartDate() {
        // ✅ Fixed: Provide fallback date if startDate or date is undefined
        const dateString = info.startDate || info.date || new Date().toISOString()
        const date = new Date(dateString)
        setStartDate(date.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}))
        setStartDay(date.toLocaleDateString('en-US', {weekday: 'long'}))
        setStartTime(date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}))
    }

    function formatEndDate() {
        // ✅ Fixed: Provide fallback date if endDate, startDate, or date is undefined
        const dateString = info.endDate || info.startDate || info.date || new Date().toISOString()
        const date = new Date(dateString)
        setEndTime(date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}))
    }

    useEffect(() => {
        formatStartDate()
        formatEndDate()
    }, [info.startDate, info.endDate, info.date]);

    // ✅ Provincial Director sees Pending Provincial (approved by Division Head)
    const isPendingProvincial = info.status === 'Pending Provincial'
    const isApproved = info.status === 'Approved'
    const isDisapproved = info.status === 'Disapproved'

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Approved':
                return 'bg-green-100 text-green-700 border-2 border-green-600'
            case 'Pending Provincial':
                return 'bg-yellow-100 text-yellow-700 border-2 border-yellow-600'
            case 'Disapproved':
                return 'bg-red-100 text-red-700 border-2 border-red-600'
            default:
                return 'bg-gray-100 text-gray-700 border-2 border-gray-600'
        }
    }

    const capitalizeFirstLetter = (name: string) => {
        if (!name) return ''
        return name.charAt(0).toUpperCase() + name.slice(1)
    }

    const formatHours = (hours: string) => {
        if (!hours) return ''
        const num = parseFloat(hours)
        if (num === 1) return '1 hour'
        return `${num} hours`
    }

    return(
        <div className='flex flex-col border-[2px] border-gray-600 rounded-lg items-center mx-10 py-4 gap-3'>
            <div className='flex justify-between items-center w-full px-5 pb-4 border-b-[1px] border-gray-300'>
                <div className='flex items-center gap-6'>
                    <div className='flex flex-col'>
                        <p className='font-bold'>{startDate} ({startDay})</p>
                        <p className='text-sm text-gray-600'>
                            {startTime} - {endTime}
                        </p>
                        {info.hours && info.hours !== '0' && (
                            <p className='text-sm text-blue-600 mt-1'>{formatHours(info.hours)}</p>
                        )}
                    </div>
                    <div className='flex flex-col border-l-[2px] border-gray-300 pl-4'>
                        {info.username && (
                            <p className='font-bold text-gray-600'>
                                {capitalizeFirstLetter(info.username)}
                            </p>
                        )}
                        {info.office && (
                            <p className='font-bold text-gray-600'>
                                {info.office}
                            </p>
                        )}
                    </div>
                </div>
                <div className='flex items-center gap-3'>
                    {/* ✅ Show Approve/Disapprove buttons only for Pending Provincial */}
                    {isPendingProvincial && (
                        <>
                            <input 
                                className='border-[1px] rounded-lg px-3 py-1 cursor-pointer border-green-800 text-green-800 bg-[#EBFFD1] hover:bg-[#d4f5b0] transition-colors font-bold text-sm' 
                                type='button' 
                                value='Approve'
                                onClick={onApprove}
                            />
                            <input 
                                className='border-[1px] rounded-lg px-3 py-1 cursor-pointer border-[#990202] text-[#990202] bg-[#FFD6D6] hover:bg-[#ffb8b8] transition-colors font-bold text-sm' 
                                type='button' 
                                value='Disapprove'
                                onClick={onDisapprove}
                            />
                        </>
                    )}
                    {/* ✅ Show status badge only for Approved or Disapproved */}
                    {(isApproved || isDisapproved) && (
                        <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(info.status)}`}>
                            {info.status}
                        </span>
                    )}
                    <button className='flex text-white rounded-lg px-4 py-2 gap-2 cursor-pointer font-semibold bg-linear-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)]'>
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