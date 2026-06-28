// components/Division Head/Cards/PassSlipCard.tsx
import Image from "next/image"
import { useState, useEffect } from "react"

interface PassSlipCardProps {
    info: {
        id?: string
        date: string
        startDate?: string
        endDate?: string
        startTime?: string
        endTime?: string
        purpose: string
        destination: string
        status: string
        userId?: string
        username?: string
        office?: string
        type?: string
    }
    onApprove?: () => void
    onDisapprove?: () => void
}

export default function PassSlipCard({ info, onApprove, onDisapprove }: PassSlipCardProps) {
    const [startDate, setStartDate] = useState('')
    const [startDay, setStartDay] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')

    function formatStartDate() {
        const dateString = info.startDate || info.date
        if (!dateString) {
            console.warn('No date found for pass slip:', info)
            setStartDate('No date')
            setStartDay('')
            setStartTime('')
            return
        }
        
        try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) {
                console.warn('Invalid date:', dateString)
                setStartDate('Invalid date')
                setStartDay('')
                setStartTime('')
                return
            }
            setStartDate(date.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}))
            setStartDay(date.toLocaleDateString('en-US', {weekday: 'long'}))
            setStartTime(date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}))
        } catch (error) {
            console.error('Error formatting start date:', error)
            setStartDate('Error')
            setStartDay('')
            setStartTime('')
        }
    }

    function formatEndDate() {
        const dateString = info.endDate || info.startDate || info.date
        if (!dateString) {
            console.warn('No end date found for pass slip:', info)
            setEndTime('')
            return
        }
        
        try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) {
                console.warn('Invalid end date:', dateString)
                setEndTime('')
                return
            }
            setEndTime(date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}))
        } catch (error) {
            console.error('Error formatting end date:', error)
            setEndTime('')
        }
    }

    useEffect(() => {
        formatStartDate()
        formatEndDate()
    }, []);

    const isPending = info.status === 'Pending'
    const isPendingProvincial = info.status === 'Pending Provincial'
    const isApproved = info.status === 'Approved'
    const isDisapproved = info.status === 'Disapproved'

    // ✅ Display status - map Pending Provincial to Pending
    const getDisplayStatus = (status: string) => {
        if (status === 'Pending Provincial') {
            return 'Pending'
        }
        return status
    }

    const displayStatus = getDisplayStatus(info.status)

    const getStatusColor = (status: string) => {
        // ✅ Use display status for color
        if (displayStatus === 'Approved') {
            return 'bg-green-100 text-green-700 border-2 border-green-600'
        }
        if (displayStatus === 'Pending') {
            return 'bg-yellow-100 text-yellow-700 border-2 border-yellow-600'
        }
        if (displayStatus === 'Disapproved') {
            return 'bg-red-100 text-red-700 border-2 border-red-600'
        }
        return 'bg-gray-100 text-gray-700 border-2 border-gray-600'
    }

    const capitalizeFirstLetter = (name: string) => {
        if (!name) return ''
        return name.charAt(0).toUpperCase() + name.slice(1)
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
                        {info.type && (
                            <p className='text-sm text-gray-600'>Type: {info.type}</p>
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
                    {isPending && (
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
                    {/* ✅ Show status badge with mapped display */}
                    {(isPendingProvincial || isApproved || isDisapproved || isPending) && (
                        <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(info.status)}`}>
                            {displayStatus}
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
            <div className='flex flex-col w-full px-5'>
                <p className='font-bold text-sm'>Destination</p>
                <p className='text-gray-600 text-sm'>{info.destination}</p>
            </div>
        </div>
    )
}