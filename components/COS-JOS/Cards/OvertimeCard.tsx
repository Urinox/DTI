import Image from "next/image"
import { useState, useEffect } from "react"

interface OvertimeInfo {
    date: string,
    startTime: string,
    endTime: string,
    purpose: string,
    status: string
}

export default function OvertimeCard({info} : {info: OvertimeInfo}) {
    const [date, setDate] = useState('')
    const [day, setDay] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')

    function formatDate() {
        const date = new Date(info.date)
        setDate(date.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}))
        setDay(date.toLocaleDateString('en-US', {weekday: 'long'}))
    }

    function formatTime() {
        const stime = new Date(info.startTime)
        const etime = new Date(info.endTime)
        stime.setHours(stime.getHours() - 8)
        etime.setHours(etime.getHours() - 8)
        const options : Intl.DateTimeFormatOptions = {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        }
        const timeformat = new Intl.DateTimeFormat('en-US', options)
        setStartTime(timeformat.format(stime))
        setEndTime(timeformat.format(etime))
    }

    useEffect(() => {
        formatDate()
        formatTime()
    }, []);

    return(
        <div className='flex flex-col border-[1] border-gray-500 rounded-lg items-center mx-10 py-4 gap-3'>
            <div className='flex justify-between items-center w-full px-5 pb-4 border-b-[1] border-gray-300'>
                <div className='flex flex-col'>
                    <p className='font-bold'>{date} ({day})</p>
                    <p>{startTime} to {endTime}</p>
                </div>
                <button className='flex text-white rounded-lg px-5 py-1 gap-2 cursor-pointer font-semibold bg-linear-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)]'>
                    <Image src='/print.svg' width={16} height={16} alt='print'/>
                    <p>Print</p>
                </button>
            </div>
            <div className='flex flex-col w-full px-5'>
                <p className={`font-bold text-sm ${info.purpose ? '' : 'hidden'}`}>Purpose</p>
                <p className='text-gray-600 text-sm'>{info.purpose}</p>
            </div>
            <div className='flex w-full px-5'><p className={`border-2 rounded-lg font-bold px-5 text-sm
            ${info.status == "Approved" ? 'border-green-800 text-green-800 bg-[#EBFFD1]' : (info.status == "Pending" ? 'border-orange-700 text-orange-700 bg-[#FFDECA]' : 'border-[#990202] text-[#990202] bg-[#FFD6D6]')}`}>{info.status}</p></div>
        </div>
    )
}