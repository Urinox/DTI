// components/COS-JOS/Cards/PassSlipCard.tsx
import Image from "next/image"
import { useState, useEffect } from "react"

interface PassSlipInfo {
    id?: string
    startDate?: string,
    endDate?: string,
    date?: string,
    purpose: string,
    destination: string,
    status: string,
    type?: string,
    username?: string
}

export default function PassSlipCard({info} : {info: PassSlipInfo}) {
    const [startDate, setStartDate] = useState('')
    const [startDay, setStartDay] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')

    function formatStartDate() {
        const dateString = info.startDate || info.date
        if (!dateString) {
            console.warn('No date found for pass slip:', info)
            return
        }
        
        try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) {
                console.warn('Invalid date:', dateString)
                return
            }
            setStartDate(date.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}))
            setStartDay(date.toLocaleDateString('en-US', {weekday: 'long'}))
            setStartTime(date.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true}))
        } catch (error) {
            console.error('Error formatting start date:', error)
        }
    }

    function formatEndDate() {
        const dateString = info.endDate || info.date
        if (!dateString) {
            console.warn('No end date found for pass slip:', info)
            return
        }
        
        try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) {
                console.warn('Invalid end date:', dateString)
                return
            }
            setEndTime(date.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true}))
        } catch (error) {
            console.error('Error formatting end date:', error)
        }
    }

    useEffect(() => {
        console.log('📋 PassSlipCard received info:', info)
        formatStartDate()
        formatEndDate()
    }, []);

    const getDisplayStatus = (status: string) => {
        if (!status) return 'Pending'
        if (status === 'Approved by Division Head') {
            return 'Pending'
        }
        if (status === 'Pending Provincial') {
            return 'Pending'
        }
        return status
    }

    const displayStatus = getDisplayStatus(info.status)

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

    const capitalizeFirstLetter = (name: string) => {
        if (!name) return ''
        return name.charAt(0).toUpperCase() + name.slice(1)
    }

    return(
        <div className='flex flex-col border-[2px] border-gray-600 rounded-lg items-center mx-10 py-4 gap-3'>
            <div className='flex justify-between items-center w-full px-5 pb-4 border-b-[1px] border-gray-300'>
                <div className='flex flex-col'>
                    <p className='font-bold'>{startDate || 'No date'} ({startDay || 'No day'})</p>
                    <p className='text-sm text-gray-600'>
                        {startTime || 'No start time'} to {endTime || 'No end time'}
                    </p>
                    {info.username && (
                        <p className='text-xs text-purple-500 mt-1'>From: {capitalizeFirstLetter(info.username)}</p>
                    )}
                    {info.type && (
                        <p className='text-sm text-gray-600'>Type: {info.type}</p>
                    )}
                </div>
                <div className='flex items-center gap-3'>
                    <p className={`border-2 rounded-lg font-bold px-5 py-1 text-sm ${getStatusColor(info.status)}`}>
                        {displayStatus || 'Pending'}
                    </p>
                    <button className='flex text-white rounded-lg px-5 py-1 gap-2 cursor-pointer font-semibold bg-linear-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)]'>
                        <Image src='/print.svg' width={16} height={16} alt='print'/>
                        <p>Print</p>
                    </button>
                </div>
            </div>
            <div className='flex flex-col w-full px-5'>
                <p className='font-bold text-sm'>Purpose</p>
                <p className='text-gray-600 text-sm'>{info.purpose || 'No purpose'}</p>
            </div>
            <div className='flex flex-col w-full px-5'>
                <p className='font-bold text-sm'>Destination</p>
                <p className='text-gray-600 text-sm'>{info.destination || 'No destination'}</p>
            </div>
        </div>
    )
}